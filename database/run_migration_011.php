<?php
/**
 * Script para ejecutar la migración 011
 * Actualiza la vista v_reservations_full para usar viajeros/checkin
 *
 * Uso: php database/run_migration_011.php
 */

require_once __DIR__ . '/../api/config/database.php';

echo "\n==============================================\n";
echo "   MIGRACIÓN 011: Vista v_reservations_full   \n";
echo "==============================================\n\n";

try {
    // Conectar a la base de datos
    $host = DB_HOST;
    $dbname = DB_NAME;
    $username = DB_USER;
    $password = DB_PASS;

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "✓ Conexión a base de datos exitosa\n\n";

    // Leer el archivo SQL
    $sql_file = __DIR__ . '/migrations/011_update_reservations_view_for_viajeros.sql';

    if (!file_exists($sql_file)) {
        throw new Exception("No se encontró el archivo de migración: $sql_file");
    }

    $sql = file_get_contents($sql_file);
    echo "✓ Archivo de migración cargado\n\n";

    // Ejecutar la migración
    echo "Ejecutando migración...\n\n";

    // Dividir las sentencias SQL
    $queries = array_filter(
        array_map('trim', explode(';', $sql)),
        function($q) {
            $q = trim($q);
            return !empty($q) && !preg_match('/^(--|#)/', $q);
        }
    );

    foreach ($queries as $query) {
        try {
            $pdo->exec($query);

            // Mostrar progreso
            if (preg_match('/^(CREATE|DROP)/i', $query)) {
                $command = strtoupper(strtok(trim($query), ' '));
                $words = preg_split('/\s+/', trim($query));
                $target = $words[1] ?? '';
                $name = $words[2] ?? '';
                if ($command === 'DROP') {
                    echo "  → $command $target $name\n";
                } else if ($command === 'CREATE') {
                    echo "  → $command $target $name\n";
                }
            }
        } catch (PDOException $e) {
            echo "  ⚠️  Error: " . $e->getMessage() . "\n";
        }
    }

    echo "\n✓ Migración ejecutada exitosamente\n\n";

    // Verificar la vista creada
    echo "Verificando vista creada...\n\n";

    $stmt = $pdo->query("SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW' AND Tables_in_$dbname = 'v_reservations_full'");
    if ($stmt->rowCount() > 0) {
        echo "  ✓ Vista 'v_reservations_full' actualizada\n";

        // Probar la vista
        $test_stmt = $pdo->query("SELECT COUNT(*) as total FROM v_reservations_full");
        $count = $test_stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "    └─ Reservas visibles: $count\n";
    } else {
        echo "  ✗ Vista 'v_reservations_full' NO EXISTE\n";
    }

    echo "\n==============================================\n";
    echo "   ✓ MIGRACIÓN COMPLETADA CON ÉXITO           \n";
    echo "==============================================\n\n";

    echo "La vista v_reservations_full ahora usa las tablas viajeros y checkin\n";
    echo "El dashboard debería mostrar correctamente los huéspedes registrados\n\n";

} catch (PDOException $e) {
    echo "\n✗ Error de base de datos:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
} catch (Exception $e) {
    echo "\n✗ Error:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
