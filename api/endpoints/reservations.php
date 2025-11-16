<?php
/**
 * Endpoint: Reservas
 * Rutas:
 * GET    /api/reservations/{code}  - Obtener reserva por código
 * GET    /api/reservations/{id}/dashboard - Datos completos para el dashboard
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../models/Guest.php';
require_once __DIR__ . '/../models/Viajero.php';
require_once __DIR__ . '/../models/Preference.php';
require_once __DIR__ . '/../models/LocalGuide.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $reservationModel = new Reservation($database);
    $guestModel = new Guest($database);
    $viajeroModel = new Viajero($database);
    $preferenceModel = new Preference($database);
    $localGuideModel = new LocalGuide($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];

    // Parsear la URI para obtener parámetros
    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    if ($method === 'GET') {

        // GET /api/reservations/{code}
        if (isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] !== 'dashboard') {
            $code = $uri_parts[$api_index + 2];

            $reservation = $reservationModel->getByCode($code);

            if (!$reservation) {
                Response::notFound("Reserva no encontrada");
            }

            // Obtener huéspedes (viajeros)
            $guests = $viajeroModel->getByReservation($reservation['id']);

            // Obtener preferencias
            $preferences = $preferenceModel->getByReservation($reservation['id']);

            Response::success([
                'reservation' => $reservation,
                'guests' => $guests,
                'preferences' => $preferences
            ]);
        }

        // GET /api/reservations/{id}/dashboard
        if (isset($uri_parts[$api_index + 3]) && $uri_parts[$api_index + 3] === 'dashboard') {
            $reservation_id = $uri_parts[$api_index + 2];

            $reservation = $reservationModel->getById($reservation_id);

            if (!$reservation) {
                Response::notFound("Reserva no encontrada");
            }

            // Obtener toda la información necesaria para el dashboard
            $accommodation = $reservationModel->getAccommodationInfo($reservation_id);
            $guests = $viajeroModel->getByReservation($reservation_id);
            $preferences = $preferenceModel->getByReservation($reservation_id);
            $localGuide = $localGuideModel->getGroupedByCategory($accommodation['id']);

            Response::success([
                'reservation' => $reservation,
                'accommodation' => $accommodation,
                'guests' => $guests,
                'preferences' => $preferences,
                'local_guide' => $localGuide
            ]);
        }
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
