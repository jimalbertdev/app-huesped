<?php
/**
 * Script para normalizar datos de la guía local
 * Separa registros concatenados con HTML en filas individuales
 */

// Habilitar visualización de errores para este script
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Iniciando script de normalización...\n";

// Incluir configuración y clase de base de datos
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "Conexión a base de datos exitosa.\n";

    // Obtener todos los registros
    $sql = "SELECT * FROM informacion_turistica_alojamiento";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Se encontraron " . count($records) . " registros para analizar.\n";

    $countSplit = 0;
    $countNew = 0;

    $conn->beginTransaction();

    foreach ($records as $record) {
        $description = $record['descripcion'];
        
        // Verificar si contiene múltiples bloques <p align=center>
        // Usamos una expresión regular para dividir
        // El delimitador será <p align=center
        // Nota: Esto asume que el formato es consistente con el ejemplo dado
        
        // Primero, normalizamos un poco el HTML para facilitar la división
        // Agregamos un marcador especial antes de cada <p align=center
        $normalized = preg_replace('/<p\s+align=center\s*>/i', '###SPLIT###<p align=center>', $description);
        
        $parts = explode('###SPLIT###', $normalized);
        
        // Filtramos partes vacías
        $parts = array_filter($parts, function($p) {
            return trim($p) !== '';
        });

        // Si hay más de 1 parte, significa que hay múltiples registros concatenados
        // Ojo: Si solo hay 1 parte pero empieza con <p align=center>, el explode generará una parte vacía al inicio y luego el contenido
        // Si el contenido original NO tenía <p align=center>, parts tendrá 1 elemento (el original)
        
        // Contamos cuántos bloques <p align=center> reales hay
        $matches = [];
        preg_match_all('/<p\s+align=center\s*>/i', $description, $matches);
        $numBlocks = count($matches[0]);

        if ($numBlocks > 1) {
            echo "Registro ID {$record['id']} contiene {$numBlocks} bloques. Procesando...\n";
            
            foreach ($parts as $part) {
                $part = trim($part);
                if (empty($part)) continue;

                // Insertar nuevo registro
                $insertSql = "INSERT INTO informacion_turistica_alojamiento (id_alojamiento, nombre, descripcion, icono) VALUES (:id_alojamiento, :nombre, :descripcion, :icono)";
                $insertStmt = $conn->prepare($insertSql);
                $insertStmt->execute([
                    ':id_alojamiento' => $record['id_alojamiento'],
                    ':nombre' => $record['nombre'], // Mantenemos el mismo nombre de categoría/título general
                    ':descripcion' => $part,
                    ':icono' => $record['icono']
                ]);
                $countNew++;
            }

            // Eliminar el registro original concatenado
            $deleteSql = "DELETE FROM informacion_turistica_alojamiento WHERE id = :id";
            $deleteStmt = $conn->prepare($deleteSql);
            $deleteStmt->execute([':id' => $record['id']]);
            
            $countSplit++;
        }
    }

    $conn->commit();
    echo "Proceso completado con éxito.\n";
    echo "Registros originales divididos/eliminados: $countSplit\n";
    echo "Nuevos registros individuales creados: $countNew\n";

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    echo "ERROR CRÍTICO: " . $e->getMessage() . "\n";
    exit(1);
}
