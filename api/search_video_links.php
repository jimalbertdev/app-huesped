<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $sql = "SELECT descripcion FROM informacion_externa_alojamiento WHERE categoria = 8 AND (descripcion LIKE '%youtube%' OR descripcion LIKE '%vimeo%') LIMIT 5";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $r) {
        echo "--------------------------------------------------\n";
        echo $r['descripcion'] . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
