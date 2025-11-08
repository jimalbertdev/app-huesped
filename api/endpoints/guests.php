<?php
/**
 * Endpoint: Huéspedes
 * Rutas:
 * POST   /api/guests              - Registrar nuevo huésped
 * GET    /api/guests/{id}         - Obtener huésped por ID
 * PUT    /api/guests/{id}         - Actualizar huésped
 * GET    /api/guests/reservation/{reservation_id} - Obtener huéspedes de una reserva
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/Guest.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../middleware/RateLimit.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $guestModel = new Guest($database);
    $reservationModel = new Reservation($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];
    $data = json_decode(file_get_contents("php://input"), true);

    // Parsear la URI
    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    // POST /api/guests - Registrar nuevo huésped
    if ($method === 'POST') {
        // Aplicar rate limiting para registro de huéspedes
        RateLimit::apply('guests');
        Response::validateRequired($data, [
            'reservation_id', 'document_type', 'document_number',
            'nationality', 'first_name', 'last_name', 'birth_date', 'sex'
        ]);

        // Verificar que la reserva existe
        $reservation = $reservationModel->getById($data['reservation_id']);
        if (!$reservation) {
            Response::notFound("Reserva no encontrada");
        }

        // Convertir is_responsible a booleano
        $is_responsible = filter_var($data['is_responsible'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Si intenta marcarse como responsable, verificar que no haya otro responsable
        if ($is_responsible) {
            $existing_responsible = $guestModel->getResponsible($data['reservation_id']);
            if ($existing_responsible) {
                Response::error("Ya existe un huésped responsable para esta reserva", 400);
            }
        }

        // Asegurar que is_responsible sea un entero (0 o 1) para MySQL
        $data['is_responsible'] = $is_responsible ? 1 : 0;

        // Crear huésped
        $guest_id = $guestModel->create($data);

        // Si es responsable, actualizar la reserva
        if ($is_responsible) {
            $reservationModel->setResponsibleGuest($data['reservation_id'], $guest_id);
        }

        // Actualizar contador de huéspedes registrados
        $reservationModel->updateRegisteredGuests($data['reservation_id']);

        $guest = $guestModel->getById($guest_id);

        Response::success($guest, "Huésped registrado exitosamente", 201);
    }

    // GET /api/guests/{id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && is_numeric($uri_parts[$api_index + 2])) {
        $id = $uri_parts[$api_index + 2];

        $guest = $guestModel->getById($id);

        if (!$guest) {
            Response::notFound("Huésped no encontrado");
        }

        Response::success($guest);
    }

    // GET /api/guests/reservation/{reservation_id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'reservation') {
        $reservation_id = $uri_parts[$api_index + 3];

        $guests = $guestModel->getByReservation($reservation_id);

        Response::success($guests);
    }

    // PUT /api/guests/{id}
    if ($method === 'PUT' && isset($uri_parts[$api_index + 2])) {
        $id = $uri_parts[$api_index + 2];

        $guest = $guestModel->getById($id);
        if (!$guest) {
            Response::notFound("Huésped no encontrado");
        }

        $guestModel->update($id, $data);

        $updated_guest = $guestModel->getById($id);

        Response::success($updated_guest, "Huésped actualizado exitosamente");
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
