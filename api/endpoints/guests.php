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
require_once __DIR__ . '/../services/ContractService.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $guestModel = new Guest($database);
    $reservationModel = new Reservation($database);

    $method = $_SERVER['REQUEST_METHOD'];
    $request_uri = $_SERVER['REQUEST_URI'];

    // Detectar si viene FormData o JSON
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    $is_multipart = strpos($content_type, 'multipart/form-data') !== false;

    if ($is_multipart) {
        // Si es multipart/form-data, usar $_POST y $_FILES
        $data = $_POST;
    } else {
        // Si es JSON, usar file_get_contents
        $data = json_decode(file_get_contents("php://input"), true);
    }

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

        // Procesar firma si viene en el request
        $signature_path = null;
        if (isset($_FILES['signature']) && $_FILES['signature']['error'] === UPLOAD_ERR_OK) {
            // Crear directorio para firmas de esta reserva
            $signatures_dir = __DIR__ . '/../../uploads/signatures/RES' . $data['reservation_id'];
            if (!file_exists($signatures_dir)) {
                mkdir($signatures_dir, 0777, true);
            }

            // Generar nombre de archivo único
            $file_extension = 'png';
            $filename = 'guest_' . time() . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $data['document_number']) . '.' . $file_extension;
            $file_path = $signatures_dir . '/' . $filename;

            // Mover archivo subido
            if (move_uploaded_file($_FILES['signature']['tmp_name'], $file_path)) {
                // Guardar ruta relativa en la base de datos
                $signature_path = '/uploads/signatures/RES' . $data['reservation_id'] . '/' . $filename;
                $data['signature_path'] = $signature_path;
            }
        }

        // Crear huésped
        $guest_id = $guestModel->create($data);

        // Si es responsable, generar contrato PDF y actualizar
        if ($is_responsible) {
            // Actualizar la reserva con el responsable
            $reservationModel->setResponsibleGuest($data['reservation_id'], $guest_id);

            // Generar contrato PDF
            try {
                $contractService = new ContractService($database);
                $contract_path = $contractService->generateContract(
                    $data['reservation_id'],
                    $guest_id,
                    $signature_path
                );

                // Actualizar el huésped con la ruta del contrato
                if ($contract_path) {
                    $guestModel->update($guest_id, [
                        'contract_path' => $contract_path
                    ]);
                }
            } catch (Exception $e) {
                // Log del error pero no fallar el registro
                error_log("Error generando contrato PDF: " . $e->getMessage());
            }
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
