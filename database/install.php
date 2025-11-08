<?php
/**
 * Script de instalación de la base de datos
 * Ejecuta el archivo schema.sql 
 */

// Configuración
$host = 'localhost';
$port = '3306';
$dbname = 'moon_desarrollo';
$user = 'root';
$pass = '12345678';

echo "===========================================\n";
echo "VACANFLY - Instalador de Base de Datos\n";
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

    // Leer archivo SQL
    echo "3. Leyendo archivo schema.sql...\n";
    $sql_file = __DIR__ . '/schema.sql';

    if (!file_exists($sql_file)) {
        throw new Exception("No se encuentra el archivo schema.sql");
    }

    $sql = file_get_contents($sql_file);
    echo "   ✓ Archivo leído correctamente\n\n";

    // Ejecutar SQL
    echo "4. Ejecutando script SQL...\n";

    // Limpiar comentarios de líneas completas
    $lines = explode("\n", $sql);
    $cleanedLines = [];

    foreach ($lines as $line) {
        $trimmed = trim($line);
        // Saltar líneas vacías y comentarios que están solos en la línea
        if (empty($trimmed) || preg_match('/^--/', $trimmed)) {
            continue;
        }
        $cleanedLines[] = $line;
    }

    $cleanedSql = implode("\n", $cleanedLines);

    // Separar las vistas del resto
    $parts = preg_split('/(CREATE OR REPLACE VIEW)/i', $cleanedSql, -1, PREG_SPLIT_DELIM_CAPTURE);

    $mainSql = $parts[0]; // Todo antes de las vistas

    // Dividir comandos principales por punto y coma
    $statements = explode(';', $mainSql);

    $executed = 0;
    foreach ($statements as $statement) {
        $stmt = trim($statement);

        // Saltar si está vacío
        if (empty($stmt)) {
            continue;
        }

        try {
            $pdo->exec($stmt);
            $executed++;

            // Mostrar qué tipo de comando se ejecutó
            if (stripos($stmt, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?`?(\w+)`?\s/i', $stmt, $matches);
                if (isset($matches[1])) {
                    echo "   ✓ Tabla: {$matches[1]}\n";
                }
            } elseif (stripos($stmt, 'ALTER TABLE') !== false) {
                echo "   ✓ Constraint agregado\n";
            } elseif (stripos($stmt, 'INSERT INTO') !== false) {
                preg_match('/INSERT INTO\s+`?(\w+)`?/i', $stmt, $matches);
                if (isset($matches[1])) {
                    echo "   ✓ Datos: {$matches[1]}\n";
                }
            }
        } catch (PDOException $e) {
            // Ignorar errores de "tabla ya existe"
            if (strpos($e->getMessage(), 'already exists') === false &&
                strpos($e->getMessage(), 'Duplicate entry') === false) {
                echo "   ⚠ Advertencia: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n   ✓ Total ejecutados: $executed comandos\n\n";

    // Ejecutar vistas por separado
    echo "5. Creando vistas...\n";

    // Vista v_reservations_full
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

    $pdo->exec($view1);

    // Vista v_guests_with_reservation
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

    $pdo->exec($view2);

    echo "   ✓ Vistas creadas\n\n";

    // Verificar instalación
    echo "6. Verificando instalación...\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "   ✓ Tablas/Vistas totales: " . count($tables) . "\n";
    echo "   - " . implode("\n   - ", $tables) . "\n\n";

    // Verificar datos de ejemplo
    $result = $pdo->query("SELECT COUNT(*) as total FROM hosts")->fetch();
    echo "   ✓ Anfitriones: " . $result['total'] . "\n";

    $result = $pdo->query("SELECT COUNT(*) as total FROM accommodations")->fetch();
    echo "   ✓ Alojamientos: " . $result['total'] . "\n";

    $result = $pdo->query("SELECT COUNT(*) as total FROM reservations")->fetch();
    echo "   ✓ Reservas de ejemplo: " . $result['total'] . "\n";

    $result = $pdo->query("SELECT COUNT(*) as total FROM welcome_videos")->fetch();
    echo "   ✓ Videos de bienvenida: " . $result['total'] . "\n";

    $result = $pdo->query("SELECT COUNT(*) as total FROM local_guide_items")->fetch();
    echo "   ✓ Items de guía local: " . $result['total'] . "\n\n";

    echo "===========================================\n";
    echo "✓ INSTALACIÓN COMPLETADA EXITOSAMENTE\n";
    echo "===========================================\n\n";
    echo "Puedes probar la API en:\n";
    echo "http://localhost/app_huesped/api/health\n";
    echo "http://localhost/app_huesped/api/reservations/RES-2024-001\n\n";

} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}
