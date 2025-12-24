<?php
/**
 * Script para ejecutar migración 018
 * Añade campos de Súper Anfitrión a las vistas de la aplicación
 *
 * Uso: php run_migration_018.php
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

echo "\n============================================\n";
echo "MIGRACIÓN 018: Añadir Súper Anfitrión a vistas\n";
echo "============================================\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();

    echo "✓ Conectado a la base de datos: " . DB_NAME . "\n\n";

    // Leer archivo SQL
    $sql_file = __DIR__ . '/migrations/018_add_super_host_to_views.sql';

    if (!file_exists($sql_file)) {
        throw new Exception("Archivo de migración no encontrado: $sql_file");
    }

    echo "✓ Leyendo archivo de migración...\n";
    $sql = file_get_contents($sql_file);

    // Separar statements por punto y coma
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) &&
                   strpos($stmt, '--') !== 0 &&
                   strpos($stmt, '/*') !== 0;
        }
    );

    echo "✓ Ejecutando " . count($statements) . " statements...\n\n";

    $executedStatements = 0;
    foreach ($statements as $index => $statement) {
        if (empty(trim($statement))) continue;

        try {
            echo "  Statement " . ($index + 1) . "... ";
            $conn->exec($statement);
            echo "✓ OK\n";
            $executedStatements++;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), "Unknown table") !== false &&
                strpos($statement, 'DROP VIEW') !== false) {
                echo "⚠ Vista no existía previamente, continuando...\n";
                continue;
            }
            throw $e;
        }
    }

    echo "\n===========================================\n";
    echo "VERIFICACIÓN\n";
    echo "===========================================\n\n";

    // Verificar campos específicos en v_reservations_with_host
    $column_query = "DESCRIBE v_reservations_with_host";
    $stmt = $conn->query($column_query);
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Columnas en v_reservations_with_host:\n";
    $newFields = [
        'super_host_name',
        'super_host_email',
        'super_host_phone',
        'super_host_photo'
    ];

    $allFieldsFound = true;
    foreach ($newFields as $field) {
        if (in_array($field, $columns)) {
            echo "  ✓ $field\n";
        } else {
            echo "  ✗ $field (NO ENCONTRADA)\n";
            $allFieldsFound = false;
        }
    }

    if ($allFieldsFound) {
        echo "\n✓ Todas las columnas de Súper Anfitrión están presentes.\n";
    }

    echo "\n===========================================\n";
    echo "✓ MIGRACIÓN 018 COMPLETADA EXITOSAMENTE\n";
    echo "===========================================\n";
    echo "Statements ejecutados: $executedStatements\n\n";

} catch (PDOException $e) {
    echo "\n✗ ERROR DE BASE DE DATOS:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
} catch (Exception $e) {
    echo "\n✗ ERROR:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
