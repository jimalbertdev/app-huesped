<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "--- reservas_detalles ---\n";
    $sql = "DESCRIBE reservas_detalles";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo $col['Field'] . "\n";
    }

    echo "\n--- camas_alojamiento ---\n";
    $sql = "DESCRIBE camas_alojamiento";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo $col['Field'] . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
