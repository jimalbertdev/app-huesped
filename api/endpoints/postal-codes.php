<?php
/**
 * Endpoint: Códigos Postales
 * Rutas:
 * GET /api/postal-codes?municipio_id={id} - Obtener códigos postales por municipio
 * GET /api/postal-codes/validate?municipio_id={id}&codigo_postal={cp} - Validar CP + Municipio
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    $database = new Database();
    $database->getConnection(); // Establecer conexión

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];

    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    // GET /api/postal-codes/validate?municipio_id={id}&codigo_postal={cp}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'validate') {
        $municipio_id = $_GET['municipio_id'] ?? '';
        $codigo_postal = $_GET['codigo_postal'] ?? '';

        if (empty($municipio_id) || empty($codigo_postal)) {
            Response::error("Se requieren municipio_id y codigo_postal", 400);
        }

        // Validar que el código postal pertenece al municipio
        $sql = "SELECT COUNT(*) as count 
                FROM codigos_postales_municipios 
                WHERE municipio_id = ? AND codigo_postal = ?";

        $result = $database->queryOne($sql, [$municipio_id, $codigo_postal]);
        $isValid = $result && $result['count'] > 0;

        Response::success([
            'valid' => $isValid,
            'municipio_id' => $municipio_id,
            'codigo_postal' => $codigo_postal
        ]);
    }

    // GET /api/postal-codes?municipio_id={id}
    if ($method === 'GET' && (!isset($uri_parts[$api_index + 2]) || $uri_parts[$api_index + 2] !== 'validate')) {
        $municipio_id = $_GET['municipio_id'] ?? '';

        if (empty($municipio_id)) {
            Response::error("Se requiere municipio_id", 400);
        }

        // Obtener todos los códigos postales del municipio
        $sql = "SELECT DISTINCT codigo_postal 
                FROM codigos_postales_municipios 
                WHERE municipio_id = ?
                ORDER BY codigo_postal ASC";

        $results = $database->query($sql, [$municipio_id]);

        // Formatear resultados para autocomplete
        $postalCodes = array_map(function($row) {
            return [
                'value' => $row['codigo_postal'],
                'label' => $row['codigo_postal']
            ];
        }, $results);

        Response::success([
            'municipio_id' => $municipio_id,
            'postal_codes' => $postalCodes,
            'count' => count($postalCodes)
        ]);
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
