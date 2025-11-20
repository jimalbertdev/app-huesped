<?php
/**
 * Modelo de Guía Local
 * NOTA: Ahora usa tabla 'informacion_turistica_alojamiento'
 * donde 'nombre' es la categoría y 'descripcion' es el detalle
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
            $sql = "SELECT
                        id,
                        id_alojamiento as accommodation_id,
                        nombre as category,
                        nombre as name,
                        descripcion as description,
                        icono as icon
                    FROM informacion_turistica_alojamiento
                    WHERE id_alojamiento = ? AND nombre = ?
                    ORDER BY nombre ASC";
            return $this->db->query($sql, [$accommodation_id, $category]);
        } else {
            $sql = "SELECT
                        id,
                        id_alojamiento as accommodation_id,
                        nombre as category,
                        nombre as name,
                        descripcion as description,
                        icono as icon
                    FROM informacion_turistica_alojamiento
                    WHERE id_alojamiento = ?
                    ORDER BY nombre ASC";
            return $this->db->query($sql, [$accommodation_id]);
        }
    }

    /**
     * Obtener items agrupados por categoría
     * NOTA: En la nueva estructura, cada fila es una categoría distinta
     */
    public function getGroupedByCategory($accommodation_id) {
        $items = $this->getByAccommodation($accommodation_id);

        $grouped = [];
        foreach ($items as $item) {
            $category = $item['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][] = [
                'id' => $item['id'],
                'name' => $item['name'],
                'description' => $item['description'],
                'icon' => $item['icon'],
                'category' => $item['category']
            ];
        }

        return $grouped;
    }

    /**
     * Obtener categorías únicas
     */
    public function getCategories($accommodation_id) {
        $sql = "SELECT DISTINCT nombre as category
                FROM informacion_turistica_alojamiento
                WHERE id_alojamiento = ?
                ORDER BY nombre ASC";

        return $this->db->query($sql, [$accommodation_id]);
    }
}
