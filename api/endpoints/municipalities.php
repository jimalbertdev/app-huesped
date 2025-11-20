<?php
/**
 * Endpoint: Municipios Españoles
 * Rutas:
 * GET /api/municipalities/search?q={query} - Buscar municipios
 * GET /api/municipalities/{code}           - Obtener municipio por código INE
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

    // GET /api/municipalities/search?q={query}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'search') {
        $query = $_GET['q'] ?? '';

        if (strlen($query) < 2) {
            Response::error("La búsqueda debe tener al menos 2 caracteres", 400);
        }

        // Búsqueda por nombre o código postal
        $sql = "SELECT
                    Ine as code,
                    Descripcion as name,
                    codigo_postal as postal_code,
                    CONCAT(Descripcion, ' (CP: ', codigo_postal, ')') as display_name
                FROM municipios_ine_esp
                WHERE Descripcion LIKE ? OR codigo_postal LIKE ?
                ORDER BY Descripcion ASC
                LIMIT 50";

        $searchTerm = '%' . $query . '%';
        $results = $database->query($sql, [$searchTerm, $searchTerm]);

        Response::success($results);
    }

    // GET /api/municipalities/{code}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] !== 'search') {
        $code = $uri_parts[$api_index + 2];

        $sql = "SELECT
                    Ine as code,
                    Descripcion as name,
                    codigo_postal as postal_code
                FROM municipios_ine_esp
                WHERE Ine = ?";

        $municipality = $database->queryOne($sql, [$code]);

        if (!$municipality) {
            Response::notFound("Municipio no encontrado");
        }

        Response::success($municipality);
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
