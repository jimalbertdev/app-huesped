<?php
/**
 * Migración: Convertir enlaces de video a embeds
 * Procesa registros de categoría 8 (Videos) en informacion_externa_alojamiento
 * 
 * Uso: php run_video_migration.php [--dry-run]
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

// Verificar si es dry-run
$dryRun = in_array('--dry-run', $argv);

echo "\n===========================================\n";
echo "MIGRACIÓN: Convertir videos a embeds\n";
echo "===========================================\n";
if ($dryRun) {
    echo "MODO: DRY-RUN (no se harán cambios)\n";
}
echo "Base de datos: " . DB_NAME . "\n";
echo "===========================================\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();

    echo "✓ Conectado a la base de datos\n\n";

    // Obtener registros de categoría 8
    $sql = "SELECT id, descripcion FROM informacion_externa_alojamiento WHERE categoria = 8";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Encontrados " . count($records) . " registros de video.\n\n";

    if (count($records) === 0) {
        echo "No hay registros para procesar.\n";
        exit(0);
    }

    $countUpdated = 0;
    $countSkipped = 0;
    $updates = [];

    foreach ($records as $record) {
        $description = $record['descripcion'];
        $newDescription = "";
        $hasVideo = false;

        // 1. Buscar enlaces de YouTube
        // Formatos: youtu.be/ID, youtube.com/watch?v=ID
        $youtubeMatches = [];
        preg_match_all('/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/', $description, $youtubeMatches);

        if (!empty($youtubeMatches[1])) {
            foreach ($youtubeMatches[1] as $videoId) {
                $newDescription .= '<div class="video-container mb-4"><iframe width="100%" height="315" src="https://www.youtube.com/embed/' . $videoId . '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
                $hasVideo = true;
            }
        }

        // 2. Buscar enlaces de Google Drive
        // Formato: drive.google.com/file/d/ID/view
        $driveMatches = [];
        preg_match_all('/drive\.google\.com\/file\/d\/([\w-]+)\//', $description, $driveMatches);

        if (!empty($driveMatches[1])) {
            foreach ($driveMatches[1] as $fileId) {
                $newDescription .= '<div class="video-container mb-4"><iframe src="https://drive.google.com/file/d/' . $fileId . '/preview" width="100%" height="315" allow="autoplay"></iframe></div>';
                $hasVideo = true;
            }
        }

        // Si encontramos videos, preparar actualización
        if ($hasVideo) {
            echo "ID {$record['id']}: ";
            
            // Mostrar información de conversión
            $youtubeCount = count($youtubeMatches[1] ?? []);
            $driveCount = count($driveMatches[1] ?? []);
            
            $info = [];
            if ($youtubeCount > 0) $info[] = "$youtubeCount YouTube";
            if ($driveCount > 0) $info[] = "$driveCount Google Drive";
            
            echo implode(", ", $info);
            
            if ($dryRun) {
                echo " [DRY-RUN - no actualizado]\n";
            } else {
                echo " [actualizado]\n";
            }
            
            $updates[] = [
                'id' => $record['id'],
                'descripcion' => $newDescription
            ];
            $countUpdated++;
        } else {
            echo "ID {$record['id']}: Sin videos reconocibles [omitido]\n";
            $countSkipped++;
        }
    }

    // Ejecutar actualizaciones si no es dry-run
    if (!$dryRun && count($updates) > 0) {
        echo "\n===========================================\n";
        echo "Ejecutando actualizaciones...\n";
        echo "===========================================\n\n";

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
            echo "✓ Todas las actualizaciones completadas exitosamente\n";
        } catch (PDOException $e) {
            $conn->rollBack();
            throw $e;
        }
    }

    echo "\n===========================================\n";
    echo "RESUMEN\n";
    echo "===========================================\n";
    echo "Total de registros: " . count($records) . "\n";
    echo "Registros actualizados: $countUpdated\n";
    echo "Registros omitidos: $countSkipped\n";
    
    if ($dryRun) {
        echo "\nNOTA: Esto fue un dry-run. Para aplicar los cambios,\n";
        echo "ejecuta el script sin el parámetro --dry-run\n";
    }
    
    echo "===========================================\n\n";

    if (!$dryRun && $countUpdated > 0) {
        echo "✓ MIGRACIÓN COMPLETADA EXITOSAMENTE\n\n";
    }

} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo "\n✗ ERROR DE BASE DE DATOS:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo "\n✗ ERROR:\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}
