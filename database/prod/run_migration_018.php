<?php
/**
 * Migración 018: Añadir información de Súper Anfitrión a las vistas
 * Ejecutable desde navegador web
 * 
 * URL: http://tudominio.com/database/prod/run_migration_018.php
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
    <title>Migración 018 - Añadir Súper Anfitrión a Vistas</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .info-box { background: #e7f3ff; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #2196F3; }
    </style>
</head>
<body>
<div class="container">
    <h1>🔄 Migración 018: Añadir Información de Súper Anfitrión a Vistas</h1>
    
    <div class="info-box">
        <strong>📋 Cambios:</strong><br>
        • Actualiza <code>v_reservations_full</code> con campos de Súper Anfitrión<br>
        • Actualiza <code>v_reservations_with_host</code> con campos de Súper Anfitrión<br>
        • Obtiene datos desde <code>id_personal_interno_responsable</code>
    </div>
    
<?php
ob_start();

try {
    output("Iniciando migración 018...", 'info');
    
    // ========================================
    // CONFIGURACIÓN DE BASE DE DATOS
    // ========================================
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
            $value = trim($value, '"\'');
            $envVars[$key] = $value;
        }
    }
    
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
    output("✓ Conectado a la base de datos: $DB_NAME", 'success');
    
    // ========================================
    // LEER ARCHIVO SQL
    // ========================================
    $sql_file = __DIR__ . '/migrations/018_add_super_host_to_views.sql';
    
    if (!file_exists($sql_file)) {
        throw new Exception("Archivo de migración no encontrado: $sql_file");
    }
    
    output("✓ Leyendo archivo de migración...", 'info');
    $sql = file_get_contents($sql_file);
    
    // ========================================
    // EJECUTAR STATEMENTS
    // ========================================
    
    // Eliminar vistas existentes explícitamente
    output("Eliminando vistas existentes...", 'info');
    $viewsToDrop = ['v_reservations_full', 'v_reservations_with_host'];
    
    foreach ($viewsToDrop as $viewName) {
        try {
            $conn->exec("DROP VIEW IF EXISTS $viewName");
            output("✓ Vista $viewName eliminada (si existía)", 'success');
        } catch (PDOException $e) {
            output("⚠ Vista $viewName no existía", 'warning');
        }
    }
    
    // Ejecutar CREATE VIEW
    output("Creando vistas actualizadas...", 'info');
    
    // Limpiar comentarios del SQL
    $cleanSql = preg_replace('/--[^\n]*/', '', $sql);
    $cleanSql = preg_replace('/\/\*.*?\*\//s', '', $cleanSql);
    
    // Extraer sentencias CREATE VIEW
    preg_match_all('/CREATE\s+VIEW\s+.*?;/is', $cleanSql, $matches);
    
    $executedStatements = 0;
    foreach ($matches[0] as $createStatement) {
        $createStatement = trim($createStatement);
        if (empty($createStatement)) continue;
        
        try {
            $conn->exec($createStatement);
            $executedStatements++;
            
            if (preg_match('/CREATE\s+VIEW\s+(\w+)/i', $createStatement, $viewMatch)) {
                output("✓ Vista {$viewMatch[1]} creada exitosamente", 'success');
            }
        } catch (PDOException $e) {
            output("❌ Error al crear vista: " . $e->getMessage(), 'error');
            throw $e;
        }
    }
    
    output("✓ Vistas creadas: $executedStatements", 'success');
    
    // ========================================
    // VERIFICACIÓN
    // ========================================
    output("Verificando columnas de Súper Anfitrión...", 'info');
    
    $checkColumns = $conn->query("DESCRIBE v_reservations_with_host")->fetchAll(PDO::FETCH_COLUMN);
    $newFields = ['super_host_name', 'super_host_email', 'super_host_phone', 'super_host_photo'];
    
    foreach ($newFields as $field) {
        if (in_array($field, $checkColumns)) {
            output("✓ Campo $field presente", 'success');
        } else {
            output("✗ Campo $field NO ENCONTRADO", 'error');
        }
    }
    
    output("✅ MIGRACIÓN 018 COMPLETADA EXITOSAMENTE", 'success');
    
} catch (PDOException $e) {
    output("❌ ERROR DE BASE DE DATOS:\n" . $e->getMessage(), 'error');
} catch (Exception $e) {
    output("❌ ERROR:\n" . $e->getMessage(), 'error');
}

?>
    <div style="margin-top: 20px;">
        <a href="index.html" style="text-decoration: none; background: #007bff; color: white; padding: 10px 20px; border-radius: 4px;">Volver al Panel</a>
    </div>
</div>
</body>
</html>
