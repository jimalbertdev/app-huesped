<?php
/**
 * Modelo de Guía Local
 */

class LocalGuide {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Obtener items de guía local por alojamiento
     */
    public function getByAccommodation($accommodation_id, $category = null) {
        if ($category) {
            $sql = "SELECT * FROM local_guide_items
                    WHERE accommodation_id = ? AND category = ? AND is_active = 1
                    ORDER BY order_index ASC, name ASC";
            return $this->db->query($sql, [$accommodation_id, $category]);
        } else {
            $sql = "SELECT * FROM local_guide_items
                    WHERE accommodation_id = ? AND is_active = 1
                    ORDER BY category ASC, order_index ASC, name ASC";
            return $this->db->query($sql, [$accommodation_id]);
        }
    }

    /**
     * Obtener items agrupados por categoría
     */
    public function getGroupedByCategory($accommodation_id) {
        $items = $this->getByAccommodation($accommodation_id);

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
}
