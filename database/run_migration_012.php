<?php
/**
 * Script para ejecutar migración 012
 * Actualiza vistas SQL para usar tabla 'reserva'
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

echo "\n===========================================\n";
echo "MIGRACIÓN 012: Actualizar vistas a tabla 'reserva'\n";
echo "===========================================\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Leer archivo SQL
    $sql_file = __DIR__ . '/migrations/012_update_views_to_use_reserva_table.sql';

    if (!file_exists($sql_file)) {
        throw new Exception("Archivo de migración no encontrado: $sql_file");
    }

    $sql = file_get_contents($sql_file);

    // Separar statements por punto y coma
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            // Filtrar comentarios y líneas vacías
            return !empty($stmt) &&
                   strpos($stmt, '--') !== 0 &&
                   strpos($stmt, 'USE ') !== 0;
        }
    );

    echo "Ejecutando " . count($statements) . " statements...\n\n";

    foreach ($statements as $index => $statement) {
        if (empty(trim($statement))) continue;

        try {
            echo "Statement " . ($index + 1) . "... ";
            $conn->exec($statement);
            echo "✓ OK\n";
        } catch (PDOException $e) {
            echo "✗ ERROR: " . $e->getMessage() . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n\n";
        }
    }

    echo "\n===========================================\n";
    echo "VERIFICACIÓN\n";
    echo "===========================================\n\n";

    // Verificar vistas
    $views_query = "SHOW FULL TABLES WHERE Table_type = 'VIEW'";
    $stmt = $conn->query($views_query);
    $views = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Vistas encontradas:\n";
    foreach ($views as $view) {
        echo "  ✓ $view\n";
    }

    // Probar consultas en las vistas
    echo "\nProbando v_reservations_full...\n";
    $test_query = "SELECT COUNT(*) as total FROM v_reservations_full";
    $result = $conn->query($test_query)->fetch(PDO::FETCH_ASSOC);
    echo "  Registros: " . $result['total'] . "\n";

    echo "\nProbando v_reservations_with_host...\n";
    $test_query = "SELECT COUNT(*) as total FROM v_reservations_with_host";
    $result = $conn->query($test_query)->fetch(PDO::FETCH_ASSOC);
    echo "  Registros: " . $result['total'] . "\n";

    echo "\nProbando v_guests_with_reservation...\n";
    $test_query = "SELECT COUNT(*) as total FROM v_guests_with_reservation";
    $result = $conn->query($test_query)->fetch(PDO::FETCH_ASSOC);
    echo "  Registros: " . $result['total'] . "\n";

    echo "\n===========================================\n";
    echo "✓ MIGRACIÓN 012 COMPLETADA EXITOSAMENTE\n";
    echo "===========================================\n\n";

} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}
