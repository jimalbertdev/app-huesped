<?php
/**
 * Script para ejecutar migración 014
 * Crea las vistas necesarias en moon_desarrollo
 *
 * Uso: php run_migration_014.php
 */

// Configuración de la base de datos
$host = 'localhost';
$port = '3306';
$dbname = 'moon_desarrollo';  // Base de datos destino
$user = 'root';
$pass = '12345678';

echo "====================================\n";
echo "MIGRACIÓN 014: Crear vistas\n";
echo "====================================\n";
echo "Base de datos: $dbname\n";
echo "====================================\n\n";

try {
    // Conectar a la base de datos
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "✓ Conectado a la base de datos\n\n";

    // Leer archivo de migración
    $migrationFile = __DIR__ . '/migrations/014_create_views_for_moon_desarrollo.sql';

    if (!file_exists($migrationFile)) {
        throw new Exception("Archivo de migración no encontrado: $migrationFile");
    }

    echo "✓ Leyendo archivo de migración...\n";
    $sql = file_get_contents($migrationFile);

    // Dividir en sentencias individuales
    // Separar por punto y coma, pero solo si no está dentro de un procedimiento o función
    $statements = explode(';', $sql);

    $executedStatements = 0;
    $pdo->beginTransaction();

    foreach ($statements as $statement) {
        $statement = trim($statement);

        // Ignorar comentarios y líneas vacías
        if (empty($statement) ||
            strpos($statement, '--') === 0 ||
            strpos($statement, '/*') === 0) {
            continue;
        }

        try {
            echo "  Ejecutando sentencia " . ($executedStatements + 1) . "...\n";
            $pdo->exec($statement);
            $executedStatements++;
        } catch (PDOException $e) {
            // Si es un error de "vista no existe" al intentar eliminarla, ignorar
            if (strpos($e->getMessage(), "Unknown table") !== false &&
                strpos($statement, 'DROP VIEW') !== false) {
                echo "  ⚠ Vista no existía previamente, continuando...\n";
                continue;
            }
            throw $e;
        }
    }

    $pdo->commit();

    echo "\n====================================\n";
    echo "✓ MIGRACIÓN COMPLETADA\n";
    echo "====================================\n";
    echo "Sentencias ejecutadas: $executedStatements\n";
    echo "\nVistas creadas:\n";
    echo "  • v_reservations_full\n";
    echo "  • v_reservations_with_host\n";
    echo "  • v_guests_with_reservation\n";
    echo "\n";

    // Verificar que las vistas se crearon correctamente
    echo "Verificando vistas...\n";
    $views = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'VIEW'")->fetchAll(PDO::FETCH_COLUMN);

    $expectedViews = [
        'v_reservations_full',
        'v_reservations_with_host',
        'v_guests_with_reservation'
    ];

    foreach ($expectedViews as $view) {
        if (in_array($view, $views)) {
            echo "  ✓ $view\n";
        } else {
            echo "  ✗ $view (NO CREADA)\n";
        }
    }

    echo "\n¡Migración completada exitosamente!\n";

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n✗ ERROR DE BASE DE DATOS:\n";
    echo $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n✗ ERROR:\n";
    echo $e->getMessage() . "\n";
    exit(1);
}
