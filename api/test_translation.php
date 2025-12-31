<?php
/**
 * Script de prueba para traducción automática de términos
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';
require_once __DIR__ . '/models/Terms.php';

// Argumentos: php api/test_translation.php [id_alojamiento] [idioma]
$accommodationId = $argv[1] ?? null;
$language = $argv[2] ?? 'en';

if (!$accommodationId) {
    die("Uso: php api/test_translation.php [id_alojamiento] [idioma]\n");
}

try {
    $db = new Database();
    $termsModel = new Terms($db);
    
    echo "--- Probando traducción para Alojamiento ID: $accommodationId a idioma: $language ---\n";
    
    $result = $termsModel->getByAccommodation($accommodationId, $language);
    
    if ($result) {
        echo "Alojamiento: " . $result['accommodation_name'] . "\n";
        echo "Idioma devuelto: " . $result['language'] . "\n";
        echo "Términos (primeros 200 caracteres):\n";
        echo substr($result['terms_html'], 0, 200) . "...\n";
        
        if ($result['language'] === $language && $language !== 'es') {
            echo "\n✅ ÉXITO: Los términos fueron traducidos al idioma solicitado.\n";
        } elseif ($result['language'] === 'es' && $language !== 'es') {
            echo "\n❌ FALLO: Se devolvió en español a pesar de solicitar $language.\n";
        } else {
            echo "\nℹ️  Resultado en español (solicitado o fallback).\n";
        }
    } else {
        echo "\n❌ No se encontraron términos para este alojamiento.\n";
    }

} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
}
