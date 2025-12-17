<?php
/**
 * Modelo de Guía Local
 * ACTUALIZADO: Ahora usa tablas 'guia_local' y 'guia_local_subcategoria' con jerarquía y orden
 * 
 * Estructura de tablas:
 * - guia_local: id, nombre, descripcion (HTML), id_alojamiento, id_subcategoria
 * - guia_local_subcategoria: id, nombre, id_subcategoria (padre), orden
 */

class LocalGuide {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Obtener items de guía local agrupados y ordenados por jerarquía
     * PROCESO:
     * 1. Hacemos JOIN para conseguir info de la categoría (hija) y su padre (si existe).
     * 2. Ordenamos por el Orden del Padre (o del propio si es raíz) -> Orden de la Hija -> Nombre.
     * 3. Estructuramos el array para devolver:
     *    [
     *      {
     *         'id': 4, 'title': 'Restaurantes', 'subcategories': [
     *              { 'id': 10, 'title': 'Pizzerías', 'items': [...] }
     *          ]
     *      }
     *    ]
     */
    public function getGroupedByCategory($accommodation_id) {
        // Query para obtener todo plano pero ordenado correctamente
        $sql = "SELECT
                    gl.id as item_id,
                    gl.nombre as item_name,
                    gl.descripcion as item_description,
                    
                    sc.id as cat_id,
                    sc.nombre as cat_name,
                    sc.descripcion as cat_description,
                    sc.orden as cat_orden,
                    
                    parent.id as parent_id,
                    parent.nombre as parent_name,
                    parent.orden as parent_orden

                FROM guia_local gl
                LEFT JOIN guia_local_subcategoria sc ON gl.id_subcategoria = sc.id
                LEFT JOIN guia_local_subcategoria parent ON sc.id_subcategoria = parent.id
                
                WHERE gl.id_alojamiento = ?
                
                ORDER BY 
                    COALESCE(parent.orden, sc.orden) ASC, -- Orden del bloque principal (Padre o Hijo raíz)
                    COALESCE(parent.nombre, sc.nombre) ASC,
                    CASE WHEN parent.id IS NOT NULL THEN sc.orden ELSE 0 END ASC, -- Orden interno (Subcategorias)
                    sc.nombre ASC,
                    gl.orden ASC,
                    gl.nombre ASC";

        $rows = $this->db->query($sql, [$accommodation_id]);

        $result = [];
        $map = []; // Mapa para acceso rápido a padres por ID

        foreach ($rows as $row) {
            // Determinar quién es el "Bloque Principal" (Padre)
            $parentId = $row['parent_id'] ?: $row['cat_id'];
            $parentName = $row['parent_name'] ?: $row['cat_name'];
            
            // Inicializar Padre si no existe
            if (!isset($map[$parentId])) {
                $section = [
                    'id' => $parentId,
                    'title' => $parentName,
                    'items' => [], // Items directos del padre (si hubiera)
                    'subcategories' => [] 
                ];
                $map[$parentId] = $section;
                $result[] = &$map[$parentId]; // Guardamos referencia para mantener orden de inserción
            }

            // Datos del item
            $itemData = [
                'id' => $row['item_id'],
                'name' => $row['item_name'],
                'description' => $row['item_description']
            ];

            // Si hay un padre real, entonces 'sc' es una subcategoría (Hija)
            if ($row['parent_id']) {
                $subId = $row['cat_id'];
                $subName = $row['cat_name'];

                // Buscar o crer subcategoría dentro del padre
                $subIndex = $this->findSubcategoryIndex($map[$parentId]['subcategories'], $subId);
                
                if ($subIndex === false) {
                    $map[$parentId]['subcategories'][] = [
                        'id' => $subId,
                        'title' => $subName,
                        'description' => $row['cat_description'],
                        'items' => []
                    ];
                    $subIndex = count($map[$parentId]['subcategories']) - 1;
                }

                $map[$parentId]['subcategories'][$subIndex]['items'][] = $itemData;
            } else {
                // Si no hay padre real, el item pertenece directamente a la categoría raíz
                $map[$parentId]['items'][] = $itemData;
            }
            
            unset($section); // Romper referencia por seguridad
        }

        return $result;
    }

    private function findSubcategoryIndex($subcategories, $id) {
        foreach ($subcategories as $index => $sub) {
            if ($sub['id'] == $id) return $index;
        }
        return false;
    }

    /**
     * Mantiene retrocompatibilidad si se necesita obtener items planos
     */
    public function getByAccommodation($accommodation_id, $category_id = null) {
        // Implementación básica anterior
         $sql = "SELECT gl.*, sc.nombre as category FROM guia_local gl 
                 LEFT JOIN guia_local_subcategoria sc ON gl.id_subcategoria = sc.id
                 WHERE gl.id_alojamiento = ?
                 ORDER BY gl.orden ASC, gl.nombre ASC";
         if ($category_id) {
             $sql .= " AND gl.id_subcategoria = ?";
             return $this->db->query($sql, [$accommodation_id, $category_id]);
         }
         return $this->db->query($sql, [$accommodation_id]);
    }

    /**
     * Obtener categorías únicas
     */
    public function getCategories($accommodation_id) {
        $sql = "SELECT DISTINCT
                    sc.id,
                    sc.nombre as category,
                    sc.id_subcategoria as parent_id,
                    sc.orden
                FROM guia_local gl
                INNER JOIN guia_local_subcategoria sc ON gl.id_subcategoria = sc.id
                WHERE gl.id_alojamiento = ?
                ORDER BY sc.orden ASC, sc.nombre ASC";

        return $this->db->query($sql, [$accommodation_id]);
    }

    /**
     * Obtener categorías padre
     */
    public function getParentCategories($accommodation_id) {
        $sql = "SELECT DISTINCT
                    sc.id,
                    sc.nombre as category,
                    sc.orden
                FROM guia_local gl
                INNER JOIN guia_local_subcategoria sc ON gl.id_subcategoria = sc.id
                WHERE gl.id_alojamiento = ? 
                AND (sc.id_subcategoria IS NULL OR sc.id_subcategoria = 0)
                ORDER BY sc.orden ASC, sc.nombre ASC";

        return $this->db->query($sql, [$accommodation_id]);
    }

    /**
     * Obtener categorías hijas
     */
    public function getChildCategories($accommodation_id, $parent_id) {
        $sql = "SELECT DISTINCT
                    sc.id,
                    sc.nombre as category,
                    sc.id_subcategoria as parent_id,
                    sc.orden
                FROM guia_local gl
                INNER JOIN guia_local_subcategoria sc ON gl.id_subcategoria = sc.id
                WHERE gl.id_alojamiento = ? AND sc.id_subcategoria = ?
                ORDER BY sc.orden ASC, sc.nombre ASC";

        return $this->db->query($sql, [$accommodation_id, $parent_id]);
    }
}
