<?php
/**
 * Script para ejecutar migración 016
 * Crea las vistas necesarias para la aplicación
 *
 * Uso: php run_migration_016.php
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

echo "\n===========================================\n";
echo "MIGRACIÓN 016: Crear vistas de aplicación\n";
echo "===========================================\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();

    echo "✓ Conectado a la base de datos: " . DB_NAME . "\n\n";

    // Leer archivo SQL
    $sql_file = __DIR__ . '/migrations/016_create_application_views.sql';

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
            // Si es un error de "vista no existe" al intentar eliminarla, ignorar
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

    // Verificar vistas
    $views_query = "SHOW FULL TABLES WHERE Table_type = 'VIEW'";
    $stmt = $conn->query($views_query);
    $views = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Vistas encontradas en la base de datos:\n";
    foreach ($views as $view) {
        echo "  ✓ $view\n";
    }

    // Verificar vistas específicas de esta migración
    $expectedViews = [
        'v_reservations_full',
        'v_reservations_with_host',
        'v_guests_with_reservation'
    ];

    echo "\nVerificando vistas de la migración 016:\n";
    $allViewsCreated = true;
    foreach ($expectedViews as $view) {
        if (in_array($view, $views)) {
            echo "  ✓ $view\n";
        } else {
            echo "  ✗ $view (NO CREADA)\n";
            $allViewsCreated = false;
        }
    }

    if ($allViewsCreated) {
        // Probar consultas en las vistas
        echo "\nProbando vistas...\n";
        
        echo "  v_reservations_full... ";
        $result = $conn->query("SELECT COUNT(*) as total FROM v_reservations_full")->fetch(PDO::FETCH_ASSOC);
        echo "✓ {$result['total']} registros\n";

        echo "  v_reservations_with_host... ";
        $result = $conn->query("SELECT COUNT(*) as total FROM v_reservations_with_host")->fetch(PDO::FETCH_ASSOC);
        echo "✓ {$result['total']} registros\n";

        echo "  v_guests_with_reservation... ";
        $result = $conn->query("SELECT COUNT(*) as total FROM v_guests_with_reservation")->fetch(PDO::FETCH_ASSOC);
        echo "✓ {$result['total']} registros\n";
    }

    echo "\n===========================================\n";
    echo "✓ MIGRACIÓN 016 COMPLETADA EXITOSAMENTE\n";
    echo "===========================================\n";
    echo "Statements ejecutados: $executedStatements\n";
    echo "Vistas creadas: " . count($expectedViews) . "\n\n";

} catch (PDOException $e) {
    echo "\n✗ ERROR DE BASE DE DATOS:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
} catch (Exception $e) {
    echo "\n✗ ERROR:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
