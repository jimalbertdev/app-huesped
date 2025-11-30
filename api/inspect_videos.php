<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $sql = "SELECT * FROM informacion_externa_alojamiento WHERE categoria = 8 LIMIT 5";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    print_r($records);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
