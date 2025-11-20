<?php
/**
 * Endpoint: Países
 * Rutas:
 * GET /api/countries               - Listar todos los países
 * GET /api/countries/search?q={query} - Buscar países
 * GET /api/countries/{code}        - Obtener país por código
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

    // GET /api/countries - Listar todos los países
    if ($method === 'GET' && !isset($uri_parts[$api_index + 2])) {
        $sql = "SELECT
                    codiso as code,
                    codpais as code_alpha3,
                    nombre as name,
                    telephone_prefix as phone_prefix
                FROM paises
                WHERE codiso IS NOT NULL AND codiso != ''
                ORDER BY nombre ASC";

        $countries = $database->query($sql);

        Response::success($countries);
    }

    // GET /api/countries/search?q={query}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'search') {
        $query = $_GET['q'] ?? '';

        if (strlen($query) < 1) {
            Response::error("La búsqueda debe tener al menos 1 carácter", 400);
        }

        $sql = "SELECT
                    codiso as code,
                    codpais as code_alpha3,
                    nombre as name,
                    telephone_prefix as phone_prefix
                FROM paises
                WHERE (nombre LIKE ? OR codiso LIKE ? OR codpais LIKE ?)
                AND codiso IS NOT NULL AND codiso != ''
                ORDER BY nombre ASC
                LIMIT 50";

        $searchTerm = '%' . $query . '%';
        $results = $database->query($sql, [$searchTerm, $searchTerm, $searchTerm]);

        Response::success($results);
    }

    // GET /api/countries/{code}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] !== 'search') {
        $code = strtoupper($uri_parts[$api_index + 2]);

        // Buscar por codiso (2 letras) o codpais (3 letras)
        $sql = "SELECT
                    codiso as code,
                    codpais as code_alpha3,
                    nombre as name,
                    telephone_prefix as phone_prefix
                FROM paises
                WHERE codiso = ? OR codpais = ?";

        $country = $database->queryOne($sql, [$code, $code]);

        if (!$country) {
            Response::notFound("País no encontrado");
        }

        Response::success($country);
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
