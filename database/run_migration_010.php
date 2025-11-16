<?php
/**
 * Script para ejecutar la migración 010
 * Crea las tablas viajeros y checkin
 *
 * Uso: php database/run_migration_010.php
 */

require_once __DIR__ . '/../api/config/database.php';

echo "\n==============================================\n";
echo "   MIGRACIÓN 010: Tablas viajeros y checkin   \n";
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
    $sql_file = __DIR__ . '/migrations/010_create_viajeros_checkin_tables.sql';

    if (!file_exists($sql_file)) {
        throw new Exception("No se encontró el archivo de migración: $sql_file");
    }

    $sql = file_get_contents($sql_file);
    echo "✓ Archivo de migración cargado\n\n";

    // Ejecutar la migración
    echo "Ejecutando migración...\n\n";

    // Dividir por delimitador para ejecutar los triggers correctamente
    $statements = preg_split('/DELIMITER (\$\$|;)/i', $sql);

    $current_delimiter = ';';
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;

        // Cambiar delimitador si es necesario
        if (preg_match('/^(CREATE TRIGGER|CREATE PROCEDURE|CREATE FUNCTION)/i', $statement)) {
            $current_delimiter = '$$';
        }

        // Dividir por el delimitador actual
        if ($current_delimiter === '$$') {
            $queries = [$statement];
        } else {
            $queries = array_filter(
                array_map('trim', explode(';', $statement)),
                function($q) { return !empty($q); }
            );
        }

        foreach ($queries as $query) {
            if (empty($query) || preg_match('/^(--|\/\*)/i', $query)) {
                continue;
            }

            try {
                $pdo->exec($query);

                // Mostrar progreso para CREATE/INSERT/ALTER
                if (preg_match('/^(CREATE|INSERT|ALTER|DROP)/i', $query)) {
                    $command = strtoupper(strtok(trim($query), ' '));
                    $words = explode(' ', trim($query));
                    $target = $words[1] ?? '';
                    $name = $words[2] ?? '';
                    echo "  → $command $target $name\n";
                }
            } catch (PDOException $e) {
                // Ignorar errores de "ya existe" pero mostrar otros
                if (strpos($e->getMessage(), 'already exists') === false &&
                    strpos($e->getMessage(), 'Duplicate') === false) {
                    echo "  ⚠️  Error: " . $e->getMessage() . "\n";
                }
            }
        }

        if ($current_delimiter === '$$') {
            $current_delimiter = ';';
        }
    }

    echo "\n✓ Migración ejecutada exitosamente\n\n";

    // Verificar las tablas creadas
    echo "Verificando tablas creadas...\n\n";

    $tables = ['viajeros', 'checkin'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "  ✓ Tabla '$table' creada\n";

            // Contar registros
            $count_stmt = $pdo->query("SELECT COUNT(*) as total FROM $table");
            $count = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
            echo "    └─ Registros: $count\n";
        } else {
            echo "  ✗ Tabla '$table' NO EXISTE\n";
        }
    }

    // Verificar vista
    echo "\n";
    $stmt = $pdo->query("SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW' AND Tables_in_$dbname = 'v_guests_formatted'");
    if ($stmt->rowCount() > 0) {
        echo "  ✓ Vista 'v_guests_formatted' creada\n";
    }

    // Verificar triggers
    echo "\n";
    $stmt = $pdo->query("SHOW TRIGGERS WHERE `Trigger` LIKE 'before_viajero%'");
    $triggers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "  ✓ Triggers creados: " . count($triggers) . "\n";
    foreach ($triggers as $trigger) {
        echo "    └─ " . $trigger['Trigger'] . "\n";
    }

    echo "\n==============================================\n";
    echo "   ✓ MIGRACIÓN COMPLETADA CON ÉXITO           \n";
    echo "==============================================\n\n";

    echo "Próximos pasos:\n";
    echo "1. Prueba el registro de un huésped desde el frontend\n";
    echo "2. Verifica que los datos se guarden en 'viajeros' y 'checkin'\n";
    echo "3. Opcional: Migra datos antiguos descomentando la sección de migración en el SQL\n\n";

} catch (PDOException $e) {
    echo "\n✗ Error de base de datos:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
} catch (Exception $e) {
    echo "\n✗ Error:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
