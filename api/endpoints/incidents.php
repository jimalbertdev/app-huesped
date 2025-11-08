<?php
/**
 * Endpoint: Incidencias / Sugerencias / Quejas
 * Rutas:
 * POST   /api/incidents           - Crear incidencia
 * GET    /api/incidents/{reservation_id} - Obtener incidencias de una reserva
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Incident.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../middleware/RateLimit.php';
require_once __DIR__ . '/../middleware/ValidateReservation.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $incidentModel = new Incident($database);
    $reservationModel = new Reservation($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];
    $data = json_decode(file_get_contents("php://input"), true);

    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    // POST /api/incidents
    if ($method === 'POST') {
        // Aplicar rate limiting para prevenir spam de incidencias
        RateLimit::apply('incidents');
        Response::validateRequired($data, ['reservation_id', 'incident_type', 'description']);

        // Validar tipo de incidencia
        $valid_types = ['complaint', 'suggestion', 'maintenance', 'emergency'];
        if (!in_array($data['incident_type'], $valid_types)) {
            Response::error("Tipo de incidencia inválido");
        }

        // Validar reserva
        ValidateReservation::validate($reservationModel, $data['reservation_id'], false);

        $incident_id = $incidentModel->create($data);

        Response::success([
            'id' => $incident_id,
            'message' => 'Tu reporte ha sido enviado. El anfitrión será notificado.'
        ], "Incidencia registrada exitosamente", 201);
    }

    // GET /api/incidents/{reservation_id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2])) {
        $reservation_id = $uri_parts[$api_index + 2];

        // Validar reserva
        ValidateReservation::validate($reservationModel, $reservation_id, false);

        $incidents = $incidentModel->getByReservation($reservation_id);

        Response::success($incidents);
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
