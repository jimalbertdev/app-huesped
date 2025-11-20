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
    public function getByAccommodation($accommodation_id, $category = null) {
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
            return $this->db->query($sql, [$accommodation_id, $category]);
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
            return $this->db->query($sql, [$accommodation_id]);
        }
    }

    /**
     * Obtener solo videos (categoria = 8)
     */
    public function getVideos($accommodation_id) {
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

        return $this->db->query($sql, [$accommodation_id]);
    }

    /**
     * Obtener información general (todo excepto videos)
     */
    public function getGeneralInfo($accommodation_id) {
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

        return $this->db->query($sql, [$accommodation_id]);
    }

    /**
     * Obtener información agrupada por categoría
     */
    public function getGroupedByCategory($accommodation_id, $excludeVideos = false) {
        $items = $excludeVideos
            ? $this->getGeneralInfo($accommodation_id)
            : $this->getByAccommodation($accommodation_id);

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
