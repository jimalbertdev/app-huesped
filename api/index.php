<?php
/**
 * VACANFLY API - Router Principal
 * Este archivo maneja todas las peticiones a la API y las enruta a los endpoints correspondientes
 */

// Cargar configuración de base de datos (que también carga .env)
require_once __DIR__ . '/config/database.php';

// Cargar configuración CORS
require_once __DIR__ . '/config/cors.php';

// Obtener la URI de la petición
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Parsear la ruta
$path = parse_url($request_uri, PHP_URL_PATH);
$path = trim($path, '/');
$segments = explode('/', $path);

// Encontrar el índice de 'api'
$api_index = array_search('api', $segments);

if ($api_index === false) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'API no encontrada'
    ]);
    exit;
}

// Obtener el recurso (lo que viene después de /api/)
$resource = isset($segments[$api_index + 1]) ? $segments[$api_index + 1] : null;

// Enrutamiento basado en el recurso
switch ($resource) {
    case 'reservations':
        require_once __DIR__ . '/endpoints/reservations.php';
        break;

    case 'guests':
        require_once __DIR__ . '/endpoints/guests.php';
        break;

    case 'preferences':
        require_once __DIR__ . '/endpoints/preferences.php';
        break;

    case 'doors':
        require_once __DIR__ . '/endpoints/doors.php';
        break;

    case 'incidents':
        require_once __DIR__ . '/endpoints/incidents.php';
        break;

    case 'accommodation':
        require_once __DIR__ . '/endpoints/accommodation.php';
        break;

    case 'countries':
        require_once __DIR__ . '/endpoints/countries.php';
        break;

    case 'municipalities':
        require_once __DIR__ . '/endpoints/municipalities.php';
        break;

    case 'health':
        // Endpoint de health check
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'API funcionando correctamente',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0'
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint no encontrado',
            'requested_resource' => $resource,
            'available_endpoints' => [
                '/api/health',
                '/api/reservations/{code}',
                '/api/reservations/{id}/dashboard',
                '/api/guests',
                '/api/guests/{id}',
                '/api/guests/reservation/{reservation_id}',
                '/api/preferences/{reservation_id}',
                '/api/doors/unlock',
                '/api/doors/history/{reservation_id}',
                '/api/incidents',
                '/api/incidents/{reservation_id}',
                '/api/accommodation/{accommodation_id}',
                '/api/accommodation/{accommodation_id}/info',
                '/api/accommodation/{accommodation_id}/videos',
                '/api/accommodation/{accommodation_id}/guide',
                '/api/countries',
                '/api/countries/search?q={query}',
                '/api/countries/{code}',
                '/api/municipalities/search?q={query}',
                '/api/municipalities/{code}'
            ]
        ], JSON_UNESCAPED_UNICODE);
        break;
}
