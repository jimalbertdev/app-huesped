<?php
/**
 * Modelo de Información del Alojamiento
 * Maneja información externa (videos, normas, wifi, etc.) desde informacion_externa_alojamiento
 */

class AccommodationInfo {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Obtener todos los items de información por alojamiento
     */
    public function getByAccommodation($accommodation_id, $category = null, $language = 'es') {
        if ($category) {
            $sql = "SELECT
                        id,
                        id_alojamiento as accommodation_id,
                        nombre as name,
                        descripcion as description,
                        categoria as category,
                        sensible as `sensitive`,
                        orden as order_index
                    FROM informacion_externa_alojamiento
                    WHERE id_alojamiento = ? AND categoria = ?
                    ORDER BY orden ASC, nombre ASC";
            $items = $this->db->query($sql, [$accommodation_id, $category]);
        } else {
            $sql = "SELECT
                        id,
                        id_alojamiento as accommodation_id,
                        nombre as name,
                        descripcion as description,
                        categoria as category,
                        sensible as `sensitive`,
                        orden as order_index
                    FROM informacion_externa_alojamiento
                    WHERE id_alojamiento = ?
                    ORDER BY categoria ASC, orden ASC, nombre ASC";
            $items = $this->db->query($sql, [$accommodation_id]);
        }

        return $this->translateItems($items, $language);
    }

    /**
     * Obtener solo videos (categoria = 8)
     */
    public function getVideos($accommodation_id, $language = 'es') {
        $sql = "SELECT
                    id,
                    id_alojamiento as accommodation_id,
                    nombre as title,
                    descripcion as url,
                    categoria as category,
                    orden as order_index
                FROM informacion_externa_alojamiento
                WHERE id_alojamiento = ? AND categoria = '8'
                ORDER BY orden ASC, nombre ASC";

        $items = $this->db->query($sql, [$accommodation_id]);
        
        // Para videos, el campo 'url' (en descripcion) no se traduce, pero el título sí
        if ($language !== 'es' && !empty($items)) {
            require_once __DIR__ . '/../includes/GeminiService.php';
            $gemini = new GeminiService();
            
            foreach ($items as &$item) {
                if (!empty($item['title'])) {
                    $translatedTitle = $gemini->translate($item['title'], $language);
                    if ($translatedTitle) {
                        $item['title'] = $translatedTitle;
                    }
                }
            }
        }
        
        return $items;
    }

    /**
     * Obtener información general (todo excepto videos)
     */
    public function getGeneralInfo($accommodation_id, $language = 'es') {
        $sql = "SELECT
                    id,
                    id_alojamiento as accommodation_id,
                    nombre as name,
                    descripcion as description,
                    categoria as category,
                    sensible as `sensitive`,
                    orden as order_index
                FROM informacion_externa_alojamiento
                WHERE id_alojamiento = ? AND categoria != '8'
                ORDER BY categoria ASC, orden ASC, nombre ASC";

        $items = $this->db->query($sql, [$accommodation_id]);
        return $this->translateItems($items, $language);
    }

    /**
     * Obtener información agrupada por categoría
     */
    public function getGroupedByCategory($accommodation_id, $excludeVideos = false, $language = 'es') {
        $items = $excludeVideos
            ? $this->getGeneralInfo($accommodation_id, $language)
            : $this->getByAccommodation($accommodation_id, null, $language);

        $grouped = [];
        foreach ($items as $item) {
            $category = $item['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][] = $item;
        }

        return $grouped;
    }

    /**
     * Traducir items usando Gemini
     */
    private function translateItems($items, $language) {
        if ($language === 'es' || empty($items)) {
            return $items;
        }

        require_once __DIR__ . '/../includes/GeminiService.php';
        $gemini = new GeminiService();

        // 1. Recolectar todos los textos a traducir
        $textsToTranslate = [];
        $mapping = []; // Para saber a qué item y campo corresponde cada texto

        foreach ($items as $i => $item) {
            if (!empty($item['name'])) {
                $textsToTranslate[] = $item['name'];
                $mapping[] = ['index' => $i, 'field' => 'name'];
            }
            if (!empty($item['description'])) {
                $textsToTranslate[] = $item['description'];
                $mapping[] = ['index' => $i, 'field' => 'description'];
            }
        }

        if (empty($textsToTranslate)) {
            return $items;
        }

        // 2. Traducir en lotes controlados (chunks) para evitar límites de tokens y timeouts
        $chunkSize = 10;
        $totalTexts = count($textsToTranslate);
        $translatedTexts = [];
        $startTime = time();
        $timeLimit = 20; // Máximo 20 segundos para traducir todo

        for ($k = 0; $k < $totalTexts; $k += $chunkSize) {
            // Verificar si nos estamos quedando sin tiempo
            if (time() - $startTime > $timeLimit) {
                error_log("AccommodationInfo: Tiempo límite alcanzado para traducción. Usando originales para el resto.");
                $remainingCount = $totalTexts - $k;
                $translatedTexts = array_merge($translatedTexts, array_slice($textsToTranslate, $k));
                break;
            }

            $chunk = array_slice($textsToTranslate, $k, $chunkSize);
            $translatedChunk = $gemini->translateBatch($chunk, $language);
            
            if ($translatedChunk && is_array($translatedChunk) && count($translatedChunk) === count($chunk)) {
                $translatedTexts = array_merge($translatedTexts, $translatedChunk);
            } else {
                error_log("AccommodationInfo: Falló la traducción de un lote (chunk). Usando originales para este lote.");
                // Si falla un lote, usamos los originales para ese lote para no perder el orden
                $translatedTexts = array_merge($translatedTexts, $chunk);
            }
        }

        // 3. Redistribuir textos traducidos
        if (count($translatedTexts) === count($textsToTranslate)) {
            foreach ($translatedTexts as $j => $translatedText) {
                $itemIndex = $mapping[$j]['index'];
                $field = $mapping[$j]['field'];
                $items[$itemIndex][$field] = $translatedText;
            }
        } else {
            error_log("AccommodationInfo: El conteo final de traducciones no coincide.");
        }

        return $items;
    }

    /**
     * Obtener todas las categorías disponibles
     */
    public function getCategories($accommodation_id) {
        $sql = "SELECT DISTINCT categoria as category
                FROM informacion_externa_alojamiento
                WHERE id_alojamiento = ?
                ORDER BY categoria ASC";

        return $this->db->query($sql, [$accommodation_id]);
    }

    /**
     * Verificar si una categoría existe para un alojamiento
     */
    public function hasCategory($accommodation_id, $category) {
        $sql = "SELECT COUNT(*) as count
                FROM informacion_externa_alojamiento
                WHERE id_alojamiento = ? AND categoria = ?";

        $result = $this->db->queryOne($sql, [$accommodation_id, $category]);
        return $result && $result['count'] > 0;
    }
}
