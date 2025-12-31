<?php
/**
 * Servicio para interactuar con Gemini AI
 */

class GeminiService {
    private $apiKey;
    private $modelName = 'gemini-flash-latest';

    public function __construct() {
        // Cargar API Key desde variables de entorno
        $this->apiKey = $_ENV['GEMINI_API_KEY'] ?? null;
        
        if (!$this->apiKey) {
            error_log("GeminiService: GEMINI_API_KEY no encontrada en .env");
        }
    }

    /**
     * Traducir texto usando Gemini
     * 
     * @param string $text Texto HTML a traducir
     * @param string $targetLanguage Idioma destino (en, ca, fr, de, nl)
     * @return string|null Texto traducido o null en caso de error
     */
    public function translate($text, $targetLanguage) {
        if (!$this->apiKey) return null;
        if (empty($text)) return '';
        
        // Mapeo de códigos de idioma a nombres completos para el prompt
        $languages = [
            'en' => 'English',
            'ca' => 'Catalan',
            'fr' => 'French',
            'de' => 'German',
            'nl' => 'Dutch',
            'es' => 'Spanish'
        ];

        $langName = $languages[$targetLanguage] ?? $targetLanguage;

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->modelName}:generateContent?key=" . $this->apiKey;

        $prompt = "Translate the following HTML content to {$langName}. 
        Keep the HTML structure exactly the same, only translate the text content. 
        Do not add any explanations or notes, just return the translated HTML.
        
        CONTENT:
        {$text}";

        $body = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => $prompt]
                    ]
                ]
            ],
            "generationConfig" => [
                "temperature" => 0.1,
                "topK" => 1,
                "topP" => 1,
                "maxOutputTokens" => 2048,
            ]
        ];

        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);

            if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                return trim($result['candidates'][0]['content']['parts'][0]['text']);
            } else {
                error_log("GeminiService Error: " . ($result['error']['message'] ?? 'Respuesta inesperada'));
                return null;
            }
        } catch (Exception $e) {
            error_log("GeminiService Exception: " . $e->getMessage());
            return null;
        }
    }
}
