<?php
/**
 * Migración: Separar registros concatenados de guía local
 * Procesa registros de informacion_turistica_alojamiento que contienen múltiples bloques HTML
 * 
 * Uso: php run_local_guide_migration.php [--dry-run]
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

// Verificar si es dry-run
$isCli = (php_sapi_name() === 'cli');
$args = $isCli ? $argv : [];
$dryRun = in_array('--dry-run', $args) || (isset($_GET['dry-run']) && $_GET['dry-run'] == '1');

echo "\n===========================================\n";
echo "MIGRACIÓN: Separar registros de guía local\n";
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

    // Obtener todos los registros
    $sql = "SELECT * FROM informacion_turistica_alojamiento";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Encontrados " . count($records) . " registros para analizar.\n\n";

    if (count($records) === 0) {
        echo "No hay registros para procesar.\n";
        exit(0);
    }

    $countSplit = 0;
    $countNew = 0;
    $countSkipped = 0;
    $operations = [];

    foreach ($records as $record) {
        $description = $record['descripcion'];
        
        // Contar cuántos bloques <p align=center> hay
        $matches = [];
        preg_match_all('/<p\s+align=center\s*>/i', $description, $matches);
        $numBlocks = count($matches[0]);

        if ($numBlocks > 1) {
            echo "ID {$record['id']}: Contiene {$numBlocks} bloques";
            
            // Normalizar y dividir
            $normalized = preg_replace('/<p\s+align=center\s*>/i', '###SPLIT###<p align=center>', $description);
            $parts = explode('###SPLIT###', $normalized);
            
            // Filtrar partes vacías
            $parts = array_filter($parts, function($p) {
                return trim($p) !== '';
            });

            if ($dryRun) {
                echo " [DRY-RUN - se crearían " . count($parts) . " registros]\n";
            } else {
                echo " [dividiendo en " . count($parts) . " registros]\n";
            }

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

    echo "\n";

    // Ejecutar operaciones si no es dry-run
    if (!$dryRun && count($operations) > 0) {
        echo "===========================================\n";
        echo "Ejecutando operaciones...\n";
        echo "===========================================\n\n";

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

                echo "  ✓ Registro ID {$record['id']} procesado\n";
            }

            $conn->commit();
            echo "\n✓ Todas las operaciones completadas exitosamente\n";
        } catch (PDOException $e) {
            $conn->rollBack();
            throw $e;
        }
    }

    echo "\n===========================================\n";
    echo "RESUMEN\n";
    echo "===========================================\n";
    echo "Total de registros analizados: " . count($records) . "\n";
    echo "Registros a dividir: $countSplit\n";
    echo "Nuevos registros a crear: $countNew\n";
    echo "Registros sin cambios: $countSkipped\n";
    
    if ($dryRun) {
        echo "\nNOTA: Esto fue un dry-run. Para aplicar los cambios,\n";
        echo "ejecuta el script sin el parámetro --dry-run\n";
    }
    
    echo "===========================================\n\n";

    if (!$dryRun && $countSplit > 0) {
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
