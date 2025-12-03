<?php
/**
 * Endpoint: Puertas / Cerraduras
 * Rutas:
 * POST   /api/doors/unlock        - Intentar abrir puerta
 * GET    /api/doors/history/{reservation_id} - Historial de aperturas
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/DoorUnlock.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../middleware/RateLimit.php';
require_once __DIR__ . '/../middleware/ValidateReservation.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $doorUnlockModel = new DoorUnlock($database);
    $reservationModel = new Reservation($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];
    $data = json_decode(file_get_contents("php://input"), true);

    $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
    $api_index = array_search('api', $uri_parts);

    // POST /api/doors/unlock
    if ($method === 'POST' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'unlock') {
        // Aplicar rate limiting estricto para apertura de puertas
        RateLimit::apply('door_unlock');
        Response::validateRequired($data, ['reservation_id', 'door_type']);

        $reservation_id = $data['reservation_id'];
        $guest_id = $data['guest_id'] ?? null;
        $door_type = $data['door_type']; // 'portal' o 'accommodation'

        // Validar tipo de puerta
        if (!in_array($door_type, ['portal', 'accommodation'])) {
            Response::error("Tipo de puerta inválido");
        }

        // Validar reserva (existencia, estado, fechas)
        $reservation = ValidateReservation::validate($reservationModel, $reservation_id, true);

        // Verificar que todos los huéspedes estén registrados
        if (!$reservationModel->areAllGuestsRegistered($reservation_id)) {
            Response::error("Debes completar el registro de todos los huéspedes antes de abrir puertas", 403);
        }

        // Intentar abrir la puerta
        $result = $doorUnlockModel->attemptUnlock($reservation_id, $guest_id, $door_type);

        if ($result['success']) {
            Response::success($result, "Puerta abierta exitosamente");
        } else {
            Response::error(
                "No se pudo abrir la puerta: " . $result['error_message'],
                500,
                $result
            );
        }
    }

    // GET /api/doors/info/{reservation_id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'info') {
        $reservation_id = $uri_parts[$api_index + 3];

        // Validar reserva
        $reservation = ValidateReservation::validate($reservationModel, $reservation_id, false);

        // Get lock information
        $lockInfo = $doorUnlockModel->getLockInfo($reservation_id);

        // Check if reservation is active (within check-in/check-out dates)
        $timezone = new DateTimeZone('Europe/Madrid');
        $now = new DateTime('now', $timezone);
        
        // Usar los nombres de campo correctos del modelo Reservation
        $checkInDate = $reservation['check_in_date'] ?? date('Y-m-d');
        $checkInTime = $reservation['check_in_time'] ?? '15:00:00';
        $checkOutDate = $reservation['check_out_date'] ?? date('Y-m-d');
        $checkOutTime = $reservation['check_out_time'] ?? '11:00:00';
        
        $checkin = new DateTime($checkInDate . ' ' . $checkInTime, $timezone);
        $checkout = new DateTime($checkOutDate . ' ' . $checkOutTime, $timezone);

        $is_active = ($now >= $checkin && $now <= $checkout);

        // Check if responsible guest has registered
        $has_responsible = $reservationModel->areAllGuestsRegistered($reservation_id);

        $lockInfo['is_active'] = $is_active;
        $lockInfo['has_responsible'] = $has_responsible;
        $lockInfo['can_unlock'] = $is_active && $has_responsible && $lockInfo['has_locks'];

        Response::success($lockInfo);
    }

    // GET /api/doors/history/{reservation_id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'history') {
        $reservation_id = $uri_parts[$api_index + 3];

        // Validar reserva
        ValidateReservation::validate($reservationModel, $reservation_id, false);

        $history = $doorUnlockModel->getHistory($reservation_id);

        Response::success($history);
    }

    // POST /api/doors/confirm-entry/{reservation_id}
    if ($method === 'POST' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'confirm-entry') {
        $reservation_id = $uri_parts[$api_index + 3];

        // Validar reserva
        ValidateReservation::validate($reservationModel, $reservation_id, false);

        // Update reservation status to "in-house" or "confirmed"
        $sql = "UPDATE reserva SET estado_reserva_id = 5, updated_at = NOW() WHERE id = ?";
        $result = $db->execute($sql, [$reservation_id]);

        if ($result) {
            // Log the entry confirmation
            $doorUnlockModel->logUnlock(
                $reservation_id,
                null,
                'accommodation',
                true,
                'Huésped ha confirmado ingreso al alojamiento'
            );

            Response::success(['message' => 'Entry confirmed successfully']);
        } else {
            Response::error('Failed to confirm entry');
        }
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
