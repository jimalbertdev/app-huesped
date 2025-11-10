<?php
/**
 * Script de instalación de la base de datos
 * Ejecuta schema.sql y todas las migraciones en orden
 *
 * Uso:
 *   php install.php
 *   php install.php --skip-schema  (solo ejecutar migraciones)
 */

// Cargar variables de entorno si existe el archivo .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

// Configuración (priorizar variables de entorno)
$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'moon_desarrollo';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '12345678';

// Verificar argumentos
$skipSchema = in_array('--skip-schema', $argv ?? []);

echo "===========================================\n";
echo "VACANFLY - Instalador de Base de Datos\n";
echo "===========================================\n";
echo "Host: $host:$port\n";
echo "Database: $dbname\n";
echo "===========================================\n\n";

try {
    // Conectar a MySQL
    echo "1. Conectando a MySQL...\n";
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "   ✓ Conexión exitosa\n\n";

    // Crear base de datos si no existe
    echo "2. Verificando base de datos '$dbname'...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");
    echo "   ✓ Base de datos lista\n\n";

    // Ejecutar schema.sql si no se saltó
    if (!$skipSchema) {
        echo "3. Ejecutando schema.sql...\n";
        $sql_file = __DIR__ . '/schema.sql';

        if (!file_exists($sql_file)) {
            throw new Exception("No se encuentra el archivo schema.sql");
        }

        $sql = file_get_contents($sql_file);
        echo "   ✓ Archivo leído correctamente\n";

        // Limpiar comentarios de líneas completas
        $lines = explode("\n", $sql);
        $cleanedLines = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if (empty($trimmed) || preg_match('/^--/', $trimmed)) {
                continue;
            }
            $cleanedLines[] = $line;
        }

        $cleanedSql = implode("\n", $cleanedLines);

        // Separar las vistas del resto
        $parts = preg_split('/(CREATE OR REPLACE VIEW)/i', $cleanedSql, -1, PREG_SPLIT_DELIM_CAPTURE);
        $mainSql = $parts[0];

        // Dividir comandos principales por punto y coma
        $statements = explode(';', $mainSql);

        $executed = 0;
        foreach ($statements as $statement) {
            $stmt = trim($statement);

            if (empty($stmt)) {
                continue;
            }

            try {
                $pdo->exec($stmt);
                $executed++;

                if (stripos($stmt, 'CREATE TABLE') !== false) {
                    preg_match('/CREATE TABLE.*?`?(\w+)`?\s/i', $stmt, $matches);
                    if (isset($matches[1])) {
                        echo "   ✓ Tabla: {$matches[1]}\n";
                    }
                } elseif (stripos($stmt, 'INSERT INTO') !== false) {
                    preg_match('/INSERT INTO\s+`?(\w+)`?/i', $stmt, $matches);
                    if (isset($matches[1])) {
                        echo "   ✓ Datos: {$matches[1]}\n";
                    }
                }
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'already exists') === false &&
                    strpos($e->getMessage(), 'Duplicate entry') === false) {
                    echo "   ⚠ Advertencia: " . $e->getMessage() . "\n";
                }
            }
        }

        echo "   ✓ Total ejecutados: $executed comandos\n\n";

        // Crear vistas por separado
        echo "4. Creando vistas base...\n";

        $view1 = "CREATE OR REPLACE VIEW v_reservations_full AS
        SELECT
            r.*,
            a.name as accommodation_name,
            a.address,
            a.city,
            h.name as host_name,
            h.email as host_email,
            h.phone as host_phone,
            g.first_name as responsible_first_name,
            g.last_name as responsible_last_name,
            g.email as responsible_email
        FROM reservations r
        JOIN accommodations a ON r.accommodation_id = a.id
        JOIN hosts h ON a.host_id = h.id
        LEFT JOIN guests g ON r.responsible_guest_id = g.id";

        try {
            $pdo->exec($view1);
            echo "   ✓ v_reservations_full\n";
        } catch (PDOException $e) {
            echo "   ⚠ v_reservations_full: " . $e->getMessage() . "\n";
        }

        $view2 = "CREATE OR REPLACE VIEW v_guests_with_reservation AS
        SELECT
            g.*,
            r.reservation_code,
            r.check_in_date,
            r.check_out_date,
            a.name as accommodation_name
        FROM guests g
        JOIN reservations r ON g.reservation_id = r.id
        JOIN accommodations a ON r.accommodation_id = a.id";

        try {
            $pdo->exec($view2);
            echo "   ✓ v_guests_with_reservation\n\n";
        } catch (PDOException $e) {
            echo "   ⚠ v_guests_with_reservation: " . $e->getMessage() . "\n\n";
        }
    } else {
        echo "3. OMITIDO schema.sql (--skip-schema)\n\n";
    }

    // Ejecutar migraciones
    echo ($skipSchema ? "3" : "5") . ". Ejecutando migraciones...\n";
    $migrationsDir = __DIR__ . '/migrations/';

    if (is_dir($migrationsDir)) {
        $migrations = glob($migrationsDir . '*.sql');
        sort($migrations); // Ordenar alfabéticamente

        if (empty($migrations)) {
            echo "   ℹ No se encontraron archivos de migración\n\n";
        } else {
            foreach ($migrations as $migrationFile) {
                $filename = basename($migrationFile);
                echo "   → Ejecutando: $filename\n";

                $migrationSql = file_get_contents($migrationFile);

                // Ejecutar la migración completa
                try {
                    $pdo->exec($migrationSql);
                    echo "   ✓ $filename completada\n";
                } catch (PDOException $e) {
                    // Ignorar errores de "ya existe"
                    if (strpos($e->getMessage(), 'already exists') === false &&
                        strpos($e->getMessage(), 'Duplicate') === false) {
                        echo "   ⚠ $filename: " . $e->getMessage() . "\n";
                    } else {
                        echo "   ✓ $filename (ya aplicada)\n";
                    }
                }
            }
            echo "\n   ✓ Migraciones completadas\n\n";
        }
    } else {
        echo "   ℹ Carpeta migrations/ no encontrada\n\n";
    }

    // Crear carpetas de uploads
    echo ($skipSchema ? "4" : "6") . ". Verificando carpetas de uploads...\n";
    $uploadsBase = __DIR__ . '/../uploads/';
    $uploadsFolders = ['signatures', 'contracts', 'documents'];

    foreach ($uploadsFolders as $folder) {
        $path = $uploadsBase . $folder;
        if (!is_dir($path)) {
            if (mkdir($path, 0755, true)) {
                echo "   ✓ Creada: uploads/$folder/\n";
            } else {
                echo "   ⚠ No se pudo crear: uploads/$folder/\n";
            }
        } else {
            echo "   ✓ Existe: uploads/$folder/\n";
        }
    }
    echo "\n";

    // Verificar instalación
    echo ($skipSchema ? "5" : "7") . ". Verificando instalación...\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "   ✓ Tablas/Vistas totales: " . count($tables) . "\n";
    echo "   - " . implode("\n   - ", $tables) . "\n\n";

    // Verificar datos de ejemplo
    $checks = [
        'hosts' => 'Anfitriones',
        'accommodations' => 'Alojamientos',
        'reservations' => 'Reservas',
        'accommodation_info' => 'Info de alojamientos',
        'accommodation_videos' => 'Videos',
        'accommodation_guide_categories' => 'Categorías de guía',
        'accommodation_guide_items' => 'Items de guía local'
    ];

    foreach ($checks as $table => $label) {
        try {
            $result = $pdo->query("SELECT COUNT(*) as total FROM $table")->fetch();
            echo "   ✓ $label: " . $result['total'] . "\n";
        } catch (PDOException $e) {
            echo "   ⚠ $label: Tabla no existe\n";
        }
    }

    echo "\n";
    echo "===========================================\n";
    echo "✓ INSTALACIÓN COMPLETADA EXITOSAMENTE\n";
    echo "===========================================\n\n";
    echo "Puedes probar la API en:\n";
    echo "http://localhost/app_huesped/api/health\n";
    echo "http://localhost/app_huesped/api/reservations/RES-2024-001\n";
    echo "http://localhost/app_huesped/api/accommodation/1\n\n";

} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}
