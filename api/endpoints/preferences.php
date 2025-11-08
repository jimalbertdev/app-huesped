<?php
/**
 * Endpoint: Preferencias
 * Rutas:
 * GET    /api/preferences/{reservation_id}  - Obtener preferencias
 * POST   /api/preferences                   - Crear/actualizar preferencias
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Preference.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../middleware/ValidateReservation.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $preferenceModel = new Preference($database);
    $reservationModel = new Reservation($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];
    $data = json_decode(file_get_contents("php://input"), true);

    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    // GET /api/preferences/{reservation_id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2])) {
        $reservation_id = $uri_parts[$api_index + 2];

        // Validar reserva
        ValidateReservation::validate($reservationModel, $reservation_id, false);

        $preferences = $preferenceModel->getByReservation($reservation_id);

        if (!$preferences) {
            Response::success([
                'reservation_id' => $reservation_id,
                'needs_crib' => false,
                'double_beds' => 0,
                'single_beds' => 0,
                'sofa_beds' => 0,
                'estimated_arrival_time' => null,
                'additional_info' => null
            ], "No hay preferencias configuradas");
        }

        Response::success($preferences);
    }

    // POST /api/preferences
    if ($method === 'POST') {
        Response::validateRequired($data, ['reservation_id']);

        // Validar reserva
        ValidateReservation::validate($reservationModel, $data['reservation_id'], false);

        $preferenceModel->upsert($data['reservation_id'], $data);

        $preferences = $preferenceModel->getByReservation($data['reservation_id']);

        Response::success($preferences, "Preferencias guardadas exitosamente");
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
