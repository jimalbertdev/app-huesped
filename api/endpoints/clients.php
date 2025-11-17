<?php
/**
 * Endpoint: Clientes
 * Rutas:
 * GET   /api/clients/{id}  - Obtener datos de cliente por ID
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Cliente.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // Obtener segmentos de la ruta
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $segments = explode('/', trim($path, '/'));

    // Encontrar el índice de 'clients'
    $clientsIndex = array_search('clients', $segments);
    $clientId = isset($segments[$clientsIndex + 1]) ? $segments[$clientsIndex + 1] : null;

    // GET /api/clients/{id} - Obtener cliente
    if ($method === 'GET' && $clientId) {
        // Validar que sea un número
        if (!is_numeric($clientId)) {
            Response::error("ID de cliente inválido", 400);
        }

        $clienteModel = new Cliente($database);
        $cliente = $clienteModel->getById((int)$clientId);

        if (!$cliente) {
            Response::error("Cliente no encontrado", 404);
        }

        Response::success($cliente, "Cliente obtenido correctamente");
    }

    // Ruta no encontrada
    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
