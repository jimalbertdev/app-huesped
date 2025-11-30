<?php
/**
 * Migración 016: Crear vistas de aplicación
 * Ejecutable desde navegador web
 * 
 * URL: http://tudominio.com/database/prod/run_migration_016.php
 */

// Configurar salida para navegador
header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Función para mostrar salida formateada
function output($message, $type = 'info') {
    $colors = [
        'success' => '#28a745',
        'error' => '#dc3545',
        'warning' => '#ffc107',
        'info' => '#17a2b8'
    ];
    $color = $colors[$type] ?? $colors['info'];
    echo "<div style='margin: 5px 0; padding: 10px; background: {$color}20; border-left: 4px solid {$color}; font-family: monospace;'>";
    echo nl2br(htmlspecialchars($message));
    echo "</div>";
    flush();
    ob_flush();
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Migración 016 - Vistas de Aplicación</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
<div class="container">
    <h1>🔄 Migración 016: Crear Vistas de Aplicación</h1>
    
<?php
ob_start();

try {
    output("Iniciando migración...", 'info');
    
    // ========================================
    // CONFIGURACIÓN DE BASE DE DATOS
    // ========================================
    // Cargar variables de entorno desde .env
    $envFile = __DIR__ . '/../../.env';
    
    if (!file_exists($envFile)) {
        throw new Exception("Archivo .env no encontrado en: $envFile");
    }
    
    $envContent = file_get_contents($envFile);
    $envLines = explode("\n", $envContent);
    $envVars = [];
    
    foreach ($envLines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            // Remover comillas si existen
            $value = trim($value, '"\'');
            $envVars[$key] = $value;
        }
    }
    
    // Configurar constantes de base de datos
    $DB_HOST = $envVars['DB_HOST'] ?? 'localhost';
    $DB_PORT = $envVars['DB_PORT'] ?? '3306';
    $DB_NAME = $envVars['DB_NAME'] ?? '';
    $DB_USER = $envVars['DB_USER'] ?? '';
    $DB_PASS = $envVars['DB_PASS'] ?? '';
    $DB_CHARSET = $envVars['DB_CHARSET'] ?? 'utf8mb4';
    
    if (empty($DB_NAME) || empty($DB_USER)) {
        throw new Exception("Configuración de base de datos incompleta en .env");
    }
    
    output("✓ Configuración cargada desde .env", 'success');
    output("Base de datos: $DB_NAME", 'info');
    
    // ========================================
    // CONEXIÓN A BASE DE DATOS
    // ========================================
    $dsn = "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=$DB_CHARSET";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $conn = new PDO($dsn, $DB_USER, $DB_PASS, $options);
    output("✓ Conectado a la base de datos", 'success');
    
    // ========================================
    // LEER ARCHIVO SQL
    // ========================================
    $sql_file = __DIR__ . '/migrations/016_create_application_views.sql';
    
    if (!file_exists($sql_file)) {
        throw new Exception("Archivo de migración no encontrado: $sql_file");
    }
    
    output("✓ Leyendo archivo de migración...", 'info');
    $sql = file_get_contents($sql_file);
    
    // ========================================
    // EJECUTAR STATEMENTS
    // ========================================
    
    // Primero, eliminar las vistas existentes explícitamente
    output("Eliminando vistas existentes...", 'info');
    $viewsToDrop = ['v_reservations_full', 'v_reservations_with_host', 'v_guests_with_reservation'];
    
    foreach ($viewsToDrop as $viewName) {
        try {
            $conn->exec("DROP VIEW IF EXISTS $viewName");
            output("✓ Vista $viewName eliminada (si existía)", 'success');
        } catch (PDOException $e) {
            // Ignorar errores si la vista no existe
        }
    }
    
    // Ahora ejecutar los CREATE VIEW
    output("Creando vistas...", 'info');
    
    // Limpiar comentarios del SQL primero
    $cleanSql = preg_replace('/--[^\n]*/', '', $sql);
    $cleanSql = preg_replace('/\/\*.*?\*\//s', '', $cleanSql);
    
    // Extraer solo las sentencias CREATE VIEW (sin los DROP)
    preg_match_all('/CREATE\s+VIEW\s+.*?;/is', $cleanSql, $matches);
    
    $executedStatements = 0;
    foreach ($matches[0] as $createStatement) {
        $createStatement = trim($createStatement);
        
        if (empty($createStatement)) continue;
        
        try {
            $conn->exec($createStatement);
            $executedStatements++;
            
            // Extraer nombre de la vista para mostrar
            if (preg_match('/CREATE\s+VIEW\s+(\w+)/i', $createStatement, $viewMatch)) {
                output("✓ Vista {$viewMatch[1]} creada exitosamente", 'success');
            } else {
                output("✓ Vista creada exitosamente", 'success');
            }
        } catch (PDOException $e) {
            output("❌ Error al crear vista: " . $e->getMessage(), 'error');
            output("SQL: " . substr($createStatement, 0, 200) . "...", 'error');
            throw $e;
        }
    }
    
    output("✓ Vistas creadas: $executedStatements", 'success');
    
    // ========================================
    // VERIFICACIÓN
    // ========================================
    output("Verificando vistas creadas...", 'info');
    
    $views_query = "SHOW FULL TABLES WHERE Table_type = 'VIEW'";
    $stmt = $conn->query($views_query);
    $views = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $expectedViews = [
        'v_reservations_full',
        'v_reservations_with_host',
        'v_guests_with_reservation'
    ];
    
    $allViewsCreated = true;
    $viewsInfo = "";
    
    foreach ($expectedViews as $view) {
        if (in_array($view, $views)) {
            // Contar registros
            $result = $conn->query("SELECT COUNT(*) as total FROM $view")->fetch(PDO::FETCH_ASSOC);
            $viewsInfo .= "✓ $view - {$result['total']} registros\n";
        } else {
            $viewsInfo .= "✗ $view - NO CREADA\n";
            $allViewsCreated = false;
        }
    }
    
    if ($allViewsCreated) {
        output($viewsInfo, 'success');
        output("✅ MIGRACIÓN 016 COMPLETADA EXITOSAMENTE", 'success');
    } else {
        output($viewsInfo, 'warning');
        output("⚠️ Algunas vistas no se crearon correctamente", 'warning');
    }
    
} catch (PDOException $e) {
    output("❌ ERROR DE BASE DE DATOS:\n" . $e->getMessage(), 'error');
} catch (Exception $e) {
    output("❌ ERROR:\n" . $e->getMessage(), 'error');
}

?>
</div>
</body>
</html>
