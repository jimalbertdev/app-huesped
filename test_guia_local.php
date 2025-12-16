<?php
/**
 * Script de prueba para verificar la guía local con las nuevas tablas
 */

// Cargar configuración
require_once __DIR__ . '/api/config/database.php';
require_once __DIR__ . '/api/includes/Database.php';
require_once __DIR__ . '/api/models/LocalGuide.php';

echo "=== Test de Guía Local ===\n\n";

try {
    // Conectar a la base de datos
    $database = new Database();
    $db = $database->getConnection();
    
    echo "✓ Conexión a base de datos exitosa\n\n";
    
    // Crear instancia del modelo
    $localGuideModel = new LocalGuide($database);
    
    // Probar con el alojamiento ID 18 (uno de los PDFs procesados)
    $accommodationId = 18;
    
    echo "--- Probando con alojamiento ID: $accommodationId ---\n\n";
    
    // 1. Obtener todos los items
    echo "1. Items de guía local:\n";
    $items = $localGuideModel->getByAccommodation($accommodationId);
    echo "   Total items: " . count($items) . "\n";
    if (count($items) > 0) {
        echo "   Primer item:\n";
        print_r($items[0]);
    }
    echo "\n";
    
    // 2. Obtener items agrupados por categoría (Jerarquía)
    echo "2. Items agrupados por categoría (Jerarquía):\n";
    $grouped = $localGuideModel->getGroupedByCategory($accommodationId);
    echo "   Total bloques padres: " . count($grouped) . "\n";
    
    foreach ($grouped as $parent) {
        echo "   [PADRE] " . $parent['title'] . " (ID: " . $parent['id'] . ")\n";
        
        // Items directos
        if (!empty($parent['items'])) {
             echo "      -> " . count($parent['items']) . " items directos\n";
        }
        
        // Subcategorías
        if (!empty($parent['subcategories'])) {
            foreach ($parent['subcategories'] as $sub) {
                echo "      [HIJA] " . $sub['title'] . " (ID: " . $sub['id'] . ") - " . count($sub['items']) . " items\n";
                 // Mostrar primer item de ejemplo
                 if (count($sub['items']) > 0) {
                     echo "          - Ejemplo: " . $sub['items'][0]['name'] . "\n";
                 }
            }
        }
    }
    echo "\n";
    
    // 3. Obtener categorías
    echo "3. Categorías disponibles:\n";
    $categories = $localGuideModel->getCategories($accommodationId);
    echo "   Total: " . count($categories) . "\n";
    foreach ($categories as $cat) {
        echo "   - ID: " . $cat['id'] . " | " . $cat['category'];
        if (isset($cat['parent_id']) && $cat['parent_id']) {
            echo " (Hija de: " . $cat['parent_id'] . ")";
        }
        echo "\n";
    }
    echo "\n";
    
    // 4. Simular respuesta de API
    echo "4. Respuesta simulada de API (formato JSON):\n";
    $apiResponse = [
        'success' => true,
        'data' => [
            'accommodation_id' => $accommodationId,
            'guide' => $grouped
        ]
    ];
    echo json_encode($apiResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
    echo "\n✓ Test completado exitosamente\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
