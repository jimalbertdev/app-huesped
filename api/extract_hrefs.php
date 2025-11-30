<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $sql = "SELECT descripcion FROM informacion_externa_alojamiento WHERE categoria = 8 LIMIT 10";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $r) {
        preg_match_all('/href="([^"]+)"/', $r['descripcion'], $matches);
        if (!empty($matches[1])) {
            print_r($matches[1]);
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
