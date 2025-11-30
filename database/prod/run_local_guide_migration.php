<?php
/**
 * Migración: Separar registros concatenados de guía local
 * Ejecutable desde navegador web
 * 
 * URL: http://tudominio.com/database/prod/run_local_guide_migration.php?dry_run=1
 * Para ejecutar real: http://tudominio.com/database/prod/run_local_guide_migration.php
 */

// Configurar salida para navegador
header('Content-Type: text/html; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Verificar si es dry-run
$dryRun = isset($_GET['dry_run']) && $_GET['dry_run'] == '1';

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
    <title>Migración de Guía Local</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        .btn { display: inline-block; padding: 10px 20px; margin: 10px 5px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .btn:hover { background: #0056b3; }
        .btn-warning { background: #ffc107; color: #000; }
        .btn-danger { background: #dc3545; }
    </style>
</head>
<body>
<div class="container">
    <h1>📍 Migración de Guía Local</h1>
    
    <?php if ($dryRun): ?>
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <strong>⚠️ MODO DRY-RUN:</strong> No se realizarán cambios en la base de datos
        </div>
    <?php else: ?>
        <div style="background: #f8d7da; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <strong>⚠️ ADVERTENCIA:</strong> Esta migración modificará datos en la base de datos
        </div>
    <?php endif; ?>
    
    <div style="margin-bottom: 20px;">
        <a href="?dry_run=1" class="btn btn-warning">🔍 Ejecutar Dry-Run</a>
        <a href="?" class="btn btn-danger" onclick="return confirm('¿Estás seguro de ejecutar esta migración? Se separarán registros concatenados.')">▶️ Ejecutar Migración Real</a>
    </div>
    
<?php
ob_start();

try {
    output("Iniciando migración de guía local...", 'info');
    
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
    
    output("✓ Configuración cargada - Base de datos: $DB_NAME", 'success');
    
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
    // OBTENER REGISTROS
    // ========================================
    $sql = "SELECT * FROM informacion_turistica_alojamiento";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    output("Encontrados " . count($records) . " registros para analizar", 'info');
    
    if (count($records) === 0) {
        output("No hay registros para procesar", 'warning');
        exit(0);
    }
    
    // ========================================
    // ANALIZAR REGISTROS
    // ========================================
    $countSplit = 0;
    $countNew = 0;
    $countSkipped = 0;
    $operations = [];
    $details = "";
    
    foreach ($records as $record) {
        $description = $record['descripcion'];
        
        // Contar bloques <p align=center>
        $matches = [];
        preg_match_all('/<p\s+align=center\s*>/i', $description, $matches);
        $numBlocks = count($matches[0]);
        
        if ($numBlocks > 1) {
            // Normalizar y dividir
            $normalized = preg_replace('/<p\s+align=center\s*>/i', '###SPLIT###<p align=center>', $description);
            $parts = explode('###SPLIT###', $normalized);
            
            // Filtrar partes vacías
            $parts = array_filter($parts, function($p) {
                return trim($p) !== '';
            });
            
            $details .= "ID {$record['id']}: {$numBlocks} bloques → " . count($parts) . " registros\n";
            
            $operations[] = [
                'type' => 'split',
                'original_id' => $record['id'],
                'parts' => $parts,
                'record' => $record
            ];
            
            $countSplit++;
            $countNew += count($parts);
        } else {
            $countSkipped++;
        }
    }
    
    if (!empty($details)) {
        output($details, 'info');
    }
    
    // ========================================
    // EJECUTAR OPERACIONES
    // ========================================
    if (!$dryRun && count($operations) > 0) {
        output("Ejecutando operaciones...", 'info');
        
        $conn->beginTransaction();
        
        try {
            foreach ($operations as $operation) {
                $record = $operation['record'];
                
                // Insertar nuevos registros individuales
                $insertSql = "INSERT INTO informacion_turistica_alojamiento (id_alojamiento, nombre, descripcion, icono) VALUES (:id_alojamiento, :nombre, :descripcion, :icono)";
                $insertStmt = $conn->prepare($insertSql);
                
                foreach ($operation['parts'] as $part) {
                    $part = trim($part);
                    if (empty($part)) continue;
                    
                    $insertStmt->execute([
                        ':id_alojamiento' => $record['id_alojamiento'],
                        ':nombre' => $record['nombre'],
                        ':descripcion' => $part,
                        ':icono' => $record['icono']
                    ]);
                }
                
                // Eliminar el registro original concatenado
                $deleteSql = "DELETE FROM informacion_turistica_alojamiento WHERE id = :id";
                $deleteStmt = $conn->prepare($deleteSql);
                $deleteStmt->execute([':id' => $record['id']]);
            }
            
            $conn->commit();
            output("✓ Todas las operaciones completadas", 'success');
        } catch (PDOException $e) {
            $conn->rollBack();
            throw $e;
        }
    }
    
    // ========================================
    // RESUMEN
    // ========================================
    $summary = "Total de registros analizados: " . count($records) . "\n";
    $summary .= "Registros a dividir: $countSplit\n";
    $summary .= "Nuevos registros a crear: $countNew\n";
    $summary .= "Registros sin cambios: $countSkipped";
    
    output($summary, 'info');
    
    if ($dryRun) {
        output("ℹ️ Esto fue un dry-run. Para aplicar los cambios, ejecuta sin ?dry_run=1", 'warning');
    } else if ($countSplit > 0) {
        output("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE", 'success');
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
