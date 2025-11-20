<?php
/**
 * Endpoint: Sugerencias y Quejas
 * Rutas:
 * POST   /api/suggestions                    - Crear nueva sugerencia/queja
 * GET    /api/suggestions/reservation/{id}   - Obtener sugerencias de una reserva
 * GET    /api/suggestions/stats/{id}         - Obtener estadísticas de una reserva
 */

require_once __DIR__ . '/includes/Database.php';
require_once __DIR__ . '/includes/Response.php';
require_once __DIR__ . '/models/Suggestion.php';
require_once __DIR__ . '/models/Reservation.php';
require_once __DIR__ . '/middleware/RateLimit.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $suggestionModel = new Suggestion($database);
    $reservationModel = new Reservation($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];

    // Parsear la URI
    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    // POST /api/suggestions - Crear nueva sugerencia/queja
    if ($method === 'POST') {
        // Aplicar rate limiting
        RateLimit::apply('incidents');

        $data = json_decode(file_get_contents("php://input"), true);

        // Validaciones obligatorias
        Response::validateRequired($data, [
            'reservation_id', 'subject', 'description', 'type'
        ]);

        // Verificar que la reserva existe
        $reservation = $reservationModel->getById($data['reservation_id']);
        if (!$reservation) {
            Response::notFound("Reserva no encontrada");
        }

        // Validar tipo
        $validTypes = ['Queja', 'Sugerencia'];
        if (!in_array($data['type'], $validTypes)) {
            Response::error("El tipo debe ser 'Queja' o 'Sugerencia'", 400);
        }

        // Sanitizar datos
        $data['subject'] = trim($data['subject']);
        $data['description'] = trim($data['description']);

        // Validar longitud
        if (strlen($data['subject']) < 3) {
            Response::error("El asunto debe tener al menos 3 caracteres", 400);
        }

        if (strlen($data['description']) < 10) {
            Response::error("La descripción debe tener al menos 10 caracteres", 400);
        }

        // Crear sugerencia
        $suggestion_id = $suggestionModel->create($data);

        // Obtener la sugerencia creada
        $suggestion = $suggestionModel->getById($suggestion_id);

        Response::success($suggestion, "Sugerencia registrada exitosamente", 201);
    }

    // GET /api/suggestions/reservation/{id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'reservation') {
        $reservation_id = $uri_parts[$api_index + 3] ?? null;

        if (!$reservation_id) {
            Response::error("ID de reserva requerido", 400);
        }

        // Verificar que la reserva existe
        $reservation = $reservationModel->getById($reservation_id);
        if (!$reservation) {
            Response::notFound("Reserva no encontrada");
        }

        $suggestions = $suggestionModel->getByReservation($reservation_id);

        Response::success($suggestions);
    }

    // GET /api/suggestions/stats/{id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'stats') {
        $reservation_id = $uri_parts[$api_index + 3] ?? null;

        if (!$reservation_id) {
            Response::error("ID de reserva requerido", 400);
        }

        // Verificar que la reserva existe
        $reservation = $reservationModel->getById($reservation_id);
        if (!$reservation) {
            Response::notFound("Reserva no encontrada");
        }

        $stats = $suggestionModel->getStats($reservation_id);

        Response::success($stats);
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
