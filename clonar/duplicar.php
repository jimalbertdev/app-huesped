<?php
/**
 * Procesar Duplicación de Alojamiento
 * Ejecuta la duplicación y muestra el resultado
 */

require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

session_start();

$database = new Database();
$db = $database->getConnection();

// Obtener ID del alojamiento
$id = $_POST['id'] ?? null;

if (!$id || !is_numeric($id)) {
    $_SESSION['message'] = 'ID de alojamiento inválido';
    $_SESSION['message_type'] = 'error';
    header('Location: index.php');
    exit;
}

try {
    // Iniciar transacción
    $db->beginTransaction();

    // Verificar que el alojamiento existe
    $query = "SELECT * FROM alojamiento WHERE idalojamiento = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$id]);
    $alojamiento = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$alojamiento) {
        throw new Exception('Alojamiento no encontrado');
    }

    // PASO 1: Duplicar el alojamiento principal
    // Obtener todos los campos de la tabla excepto el ID
    $columnsQuery = "SHOW COLUMNS FROM alojamiento";
    $stmt = $db->prepare($columnsQuery);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $fieldsList = [];
    foreach ($columns as $col) {
        // Excluir el ID (primary key auto_increment) y cualquier campo 'id'
        if ($col['Field'] !== 'idalojamiento' && 
            $col['Field'] !== 'id' && 
            $col['Extra'] !== 'auto_increment') {
            $fieldsList[] = $col['Field'];
        }
    }
    
    // Construir query dinámico
    $fieldsStr = implode(', ', $fieldsList);
    
    // Preparar SELECT con modificación del nombre y valores por defecto
    $selectFields = [];
    foreach ($fieldsList as $field) {
        if ($field === 'nombre') {
            $selectFields[] = "CONCAT(nombre, ' DUPLICADO') as nombre";
        } elseif ($field === 'referencia') {
            $selectFields[] = "CONCAT(referencia, '-DUP') as referencia";
        } elseif ($field === 'id_avail' || $field === 'idavail') {
            // Establecer ID de Avail por defecto
            $selectFields[] = "'000000000000000' as $field";
        } else {
            $selectFields[] = $field;
        }
    }
    $selectStr = implode(",\n        ", $selectFields);
    
    $query = "INSERT INTO alojamiento ($fieldsStr)
    SELECT 
        $selectStr
    FROM alojamiento
    WHERE idalojamiento = ?";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        $nuevoId = $db->lastInsertId();
    } catch (PDOException $e) {
        throw new Exception("Error en tabla ALOJAMIENTO: " . $e->getMessage() . "\n\nSQL: " . $query);
    }

    // PASO 2: Duplicar información externa
    $query = "INSERT INTO informacion_externa_alojamiento (
        id_alojamiento,
        nombre,
        descripcion,
        categoria,
        sensible,
        orden
    )
    SELECT 
        ? as id_alojamiento,
        nombre,
        descripcion,
        categoria,
        sensible,
        orden
    FROM informacion_externa_alojamiento
    WHERE id_alojamiento = ?";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->execute([$nuevoId, $id]);
        $infoExternaCount = $stmt->rowCount();
    } catch (PDOException $e) {
        throw new Exception("Error en tabla INFORMACION_EXTERNA_ALOJAMIENTO: " . $e->getMessage());
    }

    // PASO 3: Duplicar información turística
    $query = "INSERT INTO informacion_turistica_alojamiento (
        id_alojamiento,
        nombre,
        descripcion,
        icono
    )
    SELECT 
        ? as id_alojamiento,
        nombre,
        descripcion,
        icono
    FROM informacion_turistica_alojamiento
    WHERE id_alojamiento = ?";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->execute([$nuevoId, $id]);
        $infoTuristicaCount = $stmt->rowCount();
    } catch (PDOException $e) {
        throw new Exception("Error en tabla INFORMACION_TURISTICA_ALOJAMIENTO: " . $e->getMessage());
    }

    // PASO 4: Duplicar camas
    $query = "INSERT INTO camas_alojamiento (
        id_alojamiento,
        camas_dobles,
        camas_individuales,
        sofa_cama,
        literas,
        cuna
    )
    SELECT 
        ? as id_alojamiento,
        camas_dobles,
        camas_individuales,
        sofa_cama,
        literas,
        cuna
    FROM camas_alojamiento
    WHERE id_alojamiento = ?";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->execute([$nuevoId, $id]);
        $camasCount = $stmt->rowCount();
    } catch (PDOException $e) {
        throw new Exception("Error en tabla CAMAS_ALOJAMIENTO: " . $e->getMessage());
    }

    // PASO 5: Duplicar hospederia_alojamiento (si existe)
    $query = "SELECT COUNT(*) as count FROM information_schema.tables 
              WHERE table_schema = DATABASE() AND table_name = 'hospederia_alojamiento'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    
    $hospederiaCount = 0;
    if ($tableExists) {
        // Obtener estructura de la tabla
        $columnsQuery = "SHOW COLUMNS FROM hospederia_alojamiento";
        $stmt = $db->prepare($columnsQuery);
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $fieldsList = [];
        foreach ($columns as $col) {
            if ($col['Field'] !== 'id' && 
                $col['Field'] !== 'idhospederia_alojamiento' && 
                $col['Extra'] !== 'auto_increment') {
                $fieldsList[] = $col['Field'];
            }
        }
        
        if (!empty($fieldsList)) {
            $fieldsStr = implode(', ', $fieldsList);
            
            // Reemplazar id_alojamiento con el nuevo ID
            $selectFields = [];
            foreach ($fieldsList as $field) {
                if ($field === 'id_alojamiento' || $field === 'idalojamiento') {
                    $selectFields[] = "? as $field";
                } else {
                    $selectFields[] = $field;
                }
            }
            $selectStr = implode(", ", $selectFields);
            
            $query = "INSERT INTO hospederia_alojamiento ($fieldsStr)
                      SELECT $selectStr
                      FROM hospederia_alojamiento
                      WHERE " . (in_array('id_alojamiento', $fieldsList) ? 'id_alojamiento' : 'idalojamiento') . " = ?";
            
            try {
                $stmt = $db->prepare($query);
                $stmt->execute([$nuevoId, $id]);
                $hospederiaCount = $stmt->rowCount();
            } catch (PDOException $e) {
                throw new Exception("Error en tabla HOSPEDERIA_ALOJAMIENTO: " . $e->getMessage());
            }
        }
    }

    // PASO 6: Duplicar alojamiento_caracteristica (si existe)
    $query = "SELECT COUNT(*) as count FROM information_schema.tables 
              WHERE table_schema = DATABASE() AND table_name = 'alojamiento_caracteristica'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    
    $caracteristicaCount = 0;
    if ($tableExists) {
        // Obtener estructura de la tabla
        $columnsQuery = "SHOW COLUMNS FROM alojamiento_caracteristica";
        $stmt = $db->prepare($columnsQuery);
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $fieldsList = [];
        foreach ($columns as $col) {
            if ($col['Field'] !== 'id' && 
                $col['Field'] !== 'idalojamiento_caracteristica' && 
                $col['Extra'] !== 'auto_increment') {
                $fieldsList[] = $col['Field'];
            }
        }
        
        if (!empty($fieldsList)) {
            $fieldsStr = implode(', ', $fieldsList);
            
            // Reemplazar idalojamiento con el nuevo ID
            $selectFields = [];
            foreach ($fieldsList as $field) {
                if ($field === 'idalojamiento') {
                    $selectFields[] = "? as idalojamiento";
                } else {
                    $selectFields[] = $field;
                }
            }
            $selectStr = implode(", ", $selectFields);
            
            $query = "INSERT INTO alojamiento_caracteristica ($fieldsStr)
                      SELECT $selectStr
                      FROM alojamiento_caracteristica
                      WHERE idalojamiento = ?";
            
            try {
                $stmt = $db->prepare($query);
                $stmt->execute([$nuevoId, $id]);
                $caracteristicaCount = $stmt->rowCount();
            } catch (PDOException $e) {
                throw new Exception("Error en tabla ALOJAMIENTO_CARACTERISTICA: " . $e->getMessage());
            }
        }
    }

    // Confirmar transacción
    $db->commit();

    // Obtener nombre del nuevo alojamiento
    $query = "SELECT nombre FROM alojamiento WHERE idalojamiento = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$nuevoId]);
    $nuevoAlojamiento = $stmt->fetch(PDO::FETCH_ASSOC);

    // Redirigir a página de éxito
    header("Location: exito.php?id_original=$id&id_nuevo=$nuevoId&info_externa=$infoExternaCount&info_turistica=$infoTuristicaCount&camas=$camasCount&hospederia=$hospederiaCount&caracteristica=$caracteristicaCount");
    exit;

} catch (Exception $e) {
    // Revertir transacción en caso de error
    $db->rollBack();
    
    $_SESSION['message'] = 'Error al duplicar: ' . $e->getMessage();
    $_SESSION['message_type'] = 'error';
    header('Location: index.php');
    exit;
}
