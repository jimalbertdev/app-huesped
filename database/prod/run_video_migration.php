<?php
/**
 * Migración: Convertir enlaces de video a embeds
 * Ejecutable desde navegador web
 * 
 * URL: http://tudominio.com/database/prod/run_video_migration.php?dry_run=1
 * Para ejecutar real: http://tudominio.com/database/prod/run_video_migration.php
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
    <title>Migración de Videos</title>
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
    <h1>🎬 Migración de Videos</h1>
    
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
        <a href="?" class="btn btn-danger" onclick="return confirm('¿Estás seguro de ejecutar esta migración? Se modificarán los datos de videos.')">▶️ Ejecutar Migración Real</a>
    </div>
    
<?php
ob_start();

try {
    output("Iniciando migración de videos...", 'info');
    
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
    // OBTENER REGISTROS DE VIDEOS
    // ========================================
    $sql = "SELECT id, descripcion FROM informacion_externa_alojamiento WHERE categoria = 8";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    output("Encontrados " . count($records) . " registros de video", 'info');
    
    if (count($records) === 0) {
        output("No hay registros para procesar", 'warning');
        exit(0);
    }
    
    // ========================================
    // PROCESAR VIDEOS
    // ========================================
    $countUpdated = 0;
    $countSkipped = 0;
    $updates = [];
    $details = "";
    
    foreach ($records as $record) {
        $description = $record['descripcion'];
        $newDescription = "";
        $hasVideo = false;
        
        // Buscar enlaces de YouTube
        $youtubeMatches = [];
        preg_match_all('/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/', $description, $youtubeMatches);
        
        if (!empty($youtubeMatches[1])) {
            foreach ($youtubeMatches[1] as $videoId) {
                $newDescription .= '<div class="video-container mb-4"><iframe width="100%" height="315" src="https://www.youtube.com/embed/' . $videoId . '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
                $hasVideo = true;
            }
        }
        
        // Buscar enlaces de Google Drive
        $driveMatches = [];
        preg_match_all('/drive\.google\.com\/file\/d\/([\w-]+)\//', $description, $driveMatches);
        
        if (!empty($driveMatches[1])) {
            foreach ($driveMatches[1] as $fileId) {
                $newDescription .= '<div class="video-container mb-4"><iframe src="https://drive.google.com/file/d/' . $fileId . '/preview" width="100%" height="315" allow="autoplay"></iframe></div>';
                $hasVideo = true;
            }
        }
        
        if ($hasVideo) {
            $youtubeCount = count($youtubeMatches[1] ?? []);
            $driveCount = count($driveMatches[1] ?? []);
            
            $info = [];
            if ($youtubeCount > 0) $info[] = "$youtubeCount YouTube";
            if ($driveCount > 0) $info[] = "$driveCount Google Drive";
            
            $details .= "ID {$record['id']}: " . implode(", ", $info) . "\n";
            
            $updates[] = [
                'id' => $record['id'],
                'descripcion' => $newDescription
            ];
            $countUpdated++;
        } else {
            $countSkipped++;
        }
    }
    
    output($details, 'info');
    
    // ========================================
    // EJECUTAR ACTUALIZACIONES
    // ========================================
    if (!$dryRun && count($updates) > 0) {
        output("Ejecutando actualizaciones...", 'info');
        
        $conn->beginTransaction();
        
        try {
            $updateSql = "UPDATE informacion_externa_alojamiento SET descripcion = :descripcion WHERE id = :id";
            $updateStmt = $conn->prepare($updateSql);
            
            foreach ($updates as $update) {
                $updateStmt->execute([
                    ':descripcion' => $update['descripcion'],
                    ':id' => $update['id']
                ]);
            }
            
            $conn->commit();
            output("✓ Todas las actualizaciones completadas", 'success');
        } catch (PDOException $e) {
            $conn->rollBack();
            throw $e;
        }
    }
    
    // ========================================
    // RESUMEN
    // ========================================
    $summary = "Total de registros: " . count($records) . "\n";
    $summary .= "Registros a actualizar: $countUpdated\n";
    $summary .= "Registros omitidos: $countSkipped";
    
    output($summary, 'info');
    
    if ($dryRun) {
        output("ℹ️ Esto fue un dry-run. Para aplicar los cambios, ejecuta sin ?dry_run=1", 'warning');
    } else if ($countUpdated > 0) {
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
