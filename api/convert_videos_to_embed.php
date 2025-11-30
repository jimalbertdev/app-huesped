<?php
/**
 * Script para convertir enlaces de video a embeds
 * Procesa registros de categoría 8 (Videos)
 */

// Habilitar visualización de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Iniciando conversión de videos...\n";

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "Conexión exitosa.\n";

    // Obtener registros de categoría 8
    $sql = "SELECT id, descripcion FROM informacion_externa_alojamiento WHERE categoria = 8";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Encontrados " . count($records) . " registros de video.\n";

    $countUpdated = 0;
    $conn->beginTransaction();

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

        // Si encontramos videos, actualizamos el registro
        if ($hasVideo) {
            echo "Actualizando registro ID {$record['id']}...\n";
            
            $updateSql = "UPDATE informacion_externa_alojamiento SET descripcion = :descripcion WHERE id = :id";
            $updateStmt = $conn->prepare($updateSql);
            $updateStmt->execute([
                ':descripcion' => $newDescription,
                ':id' => $record['id']
            ]);
            
            $countUpdated++;
        } else {
            echo "Registro ID {$record['id']} no contiene videos reconocibles. Se omite.\n";
        }
    }

    $conn->commit();
    echo "Proceso completado.\n";
    echo "Registros actualizados: $countUpdated\n";

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
