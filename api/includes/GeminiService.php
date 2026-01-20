<?php
/**
 * Servicio para interactuar con Gemini AI
 */

class GeminiService {
    private $apiKey;
    private $modelName = 'gemini-flash-latest';
    private $cacheDir;

    public function __construct() {
        // Cargar API Key desde variables de entorno
        $this->apiKey = $_ENV['GEMINI_API_KEY'] ?? null;
        $this->cacheDir = __DIR__ . '/../cache';
        
        if (!$this->apiKey) {
            error_log("GeminiService: GEMINI_API_KEY no encontrada en .env");
        }

        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0777, true);
        }
    }

    private function getFromCache($text, $language) {
        $hash = md5($text . $language);
        $file = $this->cacheDir . '/' . $hash . '.cache';
        if (file_exists($file)) {
            return file_get_contents($file);
        }
        return null;
    }

    private function saveToCache($text, $language, $translated) {
        $hash = md5($text . $language);
        $file = $this->cacheDir . '/' . $hash . '.cache';
        @file_put_contents($file, $translated);
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

        // Check cache
        $cached = $this->getFromCache($text, $targetLanguage);
        if ($cached !== null) return $cached;
        
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);

            if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                $translated = trim($result['candidates'][0]['content']['parts'][0]['text']);
                $this->saveToCache($text, $targetLanguage, $translated);
                return $translated;
            }
            
            error_log("GeminiService Error: " . ($result['error']['message'] ?? 'Respuesta inesperada'));
            return null;
        } catch (Exception $e) {
            error_log("GeminiService Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Traducir un lote de textos usando Gemini
     * 
     * @param array $texts Lista de textos a traducir
     * @param string $targetLanguage Idioma destino
     * @return array|null Lista de textos traducidos o null en caso de error
     */
    public function translateBatch($texts, $targetLanguage) {
        if (!$this->apiKey) return null;
        if (empty($texts)) return [];

        // Check cache for all texts. If ALL are in cache, return them.
        // Otherwise, translate the ones that are missing.
        $results = [];
        $missingIndices = [];
        $missingTexts = [];
        
        foreach ($texts as $i => $text) {
            $cached = $this->getFromCache($text, $targetLanguage);
            if ($cached !== null) {
                $results[$i] = $cached;
            } else {
                $missingIndices[] = $i;
                $missingTexts[] = $text;
            }
        }
        
        if (empty($missingTexts)) {
            ksort($results);
            return array_values($results);
        }

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

        // Construir un prompt que pida JSON de vuelta para mantener el orden
        $textsJson = json_encode($missingTexts, JSON_UNESCAPED_UNICODE);
        
        $prompt = "Translate the following list of strings to {$langName}. 
        IMPORTANT: Preserve all HTML tags and structure exactly as they are. 
        Return the translations as a JSON array of strings, in the exact same order as the input.
        Do not add any explanations, notes, or markdown formatting, just the raw JSON array.
        
        LIST TO TRANSLATE:
        {$textsJson}";

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
                "maxOutputTokens" => 8192,
                "response_mime_type" => "application/json"
            ]
        ];

        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);

            if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                $translatedText = trim($result['candidates'][0]['content']['parts'][0]['text']);
                
                // Cleanup markdown
                if (strpos($translatedText, '```json') === 0) {
                    $translatedText = substr($translatedText, 7);
                    if (substr($translatedText, -3) === '```') $translatedText = substr($translatedText, 0, -3);
                } elseif (strpos($translatedText, '```') === 0) {
                    $translatedText = substr($translatedText, 3);
                    if (substr($translatedText, -3) === '```') $translatedText = substr($translatedText, 0, -3);
                }
                
                $translatedText = trim($translatedText);
                $translatedArray = json_decode($translatedText, true);
                
                if (is_array($translatedArray) && count($translatedArray) === count($missingTexts)) {
                    foreach ($translatedArray as $j => $val) {
                        $originalIndex = $missingIndices[$j];
                        $originalText = $missingTexts[$j];
                        $results[$originalIndex] = $val;
                        $this->saveToCache($originalText, $targetLanguage, $val);
                    }
                    ksort($results);
                    return array_values($results);
                } else {
                    error_log("GeminiService Error: La respuesta no es un JSON válido o el conteo no coincide. Respuesta: " . substr($translatedText, 0, 500));
                    return null;
                }
            } elseif (isset($result['error']['message'])) {
                $errorMessage = $result['error']['message'];
                error_log("GeminiService API Error: " . $errorMessage);
                return null;
            }
            return null;
        } catch (Exception $e) {
            error_log("GeminiService Exception: " . $e->getMessage());
            return null;
        }
    }
}
