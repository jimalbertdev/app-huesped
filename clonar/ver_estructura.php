<?php
// Script temporal para obtener estructura de tabla alojamiento
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/includes/Database.php';

$database = new Database();
$db = $database->getConnection();

// Obtener estructura de la tabla
$query = "SHOW COLUMNS FROM alojamiento";
$stmt = $db->prepare($query);
$stmt->execute();
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Estructura de la tabla alojamiento:</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";

$fieldsList = [];
foreach ($columns as $col) {
    echo "<tr>";
    echo "<td>" . $col['Field'] . "</td>";
    echo "<td>" . $col['Type'] . "</td>";
    echo "<td>" . $col['Null'] . "</td>";
    echo "<td>" . $col['Key'] . "</td>";
    echo "<td>" . ($col['Default'] ?? 'NULL') . "</td>";
    echo "<td>" . $col['Extra'] . "</td>";
    echo "</tr>";
    
    // Guardar campos que no sean auto_increment ni primary key
    if ($col['Extra'] !== 'auto_increment' && $col['Key'] !== 'PRI') {
        $fieldsList[] = $col['Field'];
    }
}
echo "</table>";

echo "<h3>Campos a duplicar (excluyendo ID y auto_increment):</h3>";
echo "<pre>" . implode(",\n", $fieldsList) . "</pre>";

echo "<h3>SQL INSERT para duplicación:</h3>";
echo "<pre>";
echo "INSERT INTO alojamiento (\n";
echo "    " . implode(",\n    ", $fieldsList) . "\n";
echo ")\n";
echo "SELECT \n";
echo "    " . implode(",\n    ", $fieldsList) . "\n";
echo "FROM alojamiento\n";
echo "WHERE idalojamiento = ?";
echo "</pre>";
?>
