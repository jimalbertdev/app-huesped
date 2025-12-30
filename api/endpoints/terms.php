<?php
/**
 * API Endpoint para obtener términos y condiciones
 * 
 * Endpoints:
 * - GET /api/terms/{accommodation_id}?lang={language_code} - Obtener términos por alojamiento e idioma
 */

// Cargar las clases necesarias
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Terms.php';

header('Content-Type: application/json');

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $termsModel = new Terms($database);

    // ============================================
    // GET - Obtener términos y condiciones
    // ============================================
    if ($method === 'GET') {
        // Obtener path segments desde REQUEST_URI
        $request_uri = $_SERVER['REQUEST_URI'];
        $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
        $api_index = array_search('api', $uri_parts);

        // terms/3 -> accommodation_id = 3
        $accommodationId = isset($uri_parts[$api_index + 2]) && is_numeric($uri_parts[$api_index + 2])
            ? (int)$uri_parts[$api_index + 2]
            : null;

        if (!$accommodationId) {
            Response::error('Se requiere el ID del alojamiento', 400);
        }

        // Obtener idioma desde query parameter (default: es)
        $language = $_GET['lang'] ?? 'es';
        
        // Validar que el idioma sea válido
        $validLanguages = ['es', 'en', 'ca', 'fr', 'de', 'nl'];
        if (!in_array($language, $validLanguages)) {
            $language = 'es'; // Fallback a español
        }

        // Obtener términos
        $terms = $termsModel->getByAccommodation($accommodationId, $language);

        if (!$terms) {
            Response::error('No se encontraron términos para este alojamiento', 404);
        }

        // Verificar si hay contenido HTML
        if (empty($terms['terms_html'])) {
            Response::error('No hay términos configurados para este alojamiento', 404);
        }

        Response::success($terms, 'Términos y condiciones obtenidos correctamente');
    }

    // ============================================
    // Método no permitido
    // ============================================
    else {
        Response::error('Método no permitido', 405);
    }

} catch (PDOException $e) {
    error_log("Error PDO en terms.php: " . $e->getMessage());
    error_log("Error detalle: " . print_r($e->errorInfo, true));
    Response::error('Error en la base de datos: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("Error Exception en terms.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
