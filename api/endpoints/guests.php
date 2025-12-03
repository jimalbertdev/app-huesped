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
require_once __DIR__ . '/../includes/DocumentValidator.php';
require_once __DIR__ . '/../includes/PhoneValidator.php';
require_once __DIR__ . '/../includes/PhoneCountryMap.php';
require_once __DIR__ . '/../models/Guest.php';
require_once __DIR__ . '/../models/Viajero.php';
require_once __DIR__ . '/../models/Checkin.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../middleware/RateLimit.php';
require_once __DIR__ . '/../services/ContractService.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $guestModel = new Guest($database);
    $viajeroModel = new Viajero($database);
    $checkinModel = new Checkin($database);
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
        // Validaciones básicas obligatorias
        Response::validateRequired($data, [
            'reservation_id', 'document_type', 'document_number',
            'nationality', 'first_name', 'last_name', 'birth_date', 'sex',
            'residence_country', 'residence_address',
            'phone_country_code', 'phone', 'email'
        ]);

        // Verificar que la reserva existe
        $reservation = $reservationModel->getById($data['reservation_id']);
        if (!$reservation) {
            Response::notFound("Reserva no encontrada");
        }

        // Normalizar document_type y document_number a mayúsculas
        $data['document_type'] = strtoupper(trim($data['document_type']));
        $data['document_number'] = strtoupper(trim($data['document_number']));

        // ============================================
        // VALIDACIONES CONDICIONALES
        // ============================================

        // VALIDACIÓN 0: Formato de DNI/NIE español
        if (in_array($data['document_type'], ['DNI', 'NIE'])) {
            $validationResult = DocumentValidator::validateDocument(
                $data['document_type'],
                $data['document_number']
            );

            if (!$validationResult['valid']) {
                Response::error($validationResult['error'], 400);
            }
        }

        // VALIDACIÓN 1: DNI requiere segundo apellido obligatorio
        if ($data['document_type'] === 'DNI') {
            if (empty($data['second_last_name']) || trim($data['second_last_name']) === '') {
                Response::error("El segundo apellido es obligatorio para DNI", 400);
            }
            if (empty($data['support_number']) || trim($data['support_number']) === '') {
                Response::error("El número de soporte es obligatorio para DNI", 400);
            }
            // Auto-asignar nacionalidad española para DNI
            if (empty($data['nationality']) || $data['nationality'] === '') {
                $data['nationality'] = 'ES';
            }
        }

        // VALIDACIÓN 1.1: NIE requiere número de soporte (segundo apellido opcional)
        if ($data['document_type'] === 'NIE') {
            if (empty($data['support_number']) || trim($data['support_number']) === '') {
                Response::error("El número de soporte es obligatorio para NIE", 400);
            }
        }

        // VALIDACIÓN 2: Calcular edad y validar parentesco para menores
        if (empty($data['birth_date'])) {
            Response::error("La fecha de nacimiento es obligatoria", 400);
        }

        $birthDate = new DateTime($data['birth_date']);
        $today = new DateTime();
        $age = $today->diff($birthDate)->y;

        // Validar edad razonable
        if ($age < 0 || $age > 120) {
            Response::error("La fecha de nacimiento no es válida", 400);
        }

        // Menores de 18 requieren parentesco
        if ($age < 18 && (empty($data['relationship']) || trim($data['relationship']) === '')) {
            Response::error("El campo parentesco es obligatorio para menores de 18 años", 400);
        }

        // VALIDACIÓN 3: Fechas de documento
        if (!empty($data['issue_date']) && !empty($data['expiry_date'])) {
            $issueDate = new DateTime($data['issue_date']);
            $expiryDate = new DateTime($data['expiry_date']);

            if ($expiryDate <= $issueDate) {
                Response::error("La fecha de vencimiento debe ser posterior a la fecha de expedición", 400);
            }

            if ($expiryDate < $today) {
                Response::error("El documento está vencido. Por favor, renueva tu documento antes de registrarte.", 400);
            }
        }

        // VALIDACIÓN 4: Residencia en España requiere municipio
        $data['residence_country'] = strtoupper(trim($data['residence_country']));

        if (in_array($data['residence_country'], ['ESP', 'ES'])) {
            // Normalizar a ES
            $data['residence_country'] = 'ES';

            // Requiere código de municipio o nombre
            if (empty($data['residence_municipality_code']) && empty($data['residence_municipality_name'])) {
                Response::error("Debe seleccionar un municipio español", 400);
            }

            // Si tiene código de municipio, obtener datos completos desde BD
            if (!empty($data['residence_municipality_code'])) {
                $database->getConnection();
                $sql = "SELECT Descripcion, codigo_postal FROM municipios_ine_esp WHERE Ine = ?";
                $municipality = $database->queryOne($sql, [$data['residence_municipality_code']]);

                if ($municipality) {
                    $data['residence_municipality_name'] = $municipality['Descripcion'];
                    // Autocompletar código postal si no está definido
                    if (empty($data['residence_postal_code'])) {
                        $data['residence_postal_code'] = $municipality['codigo_postal'];
                    }
                }
            }
        } else {
            // Para otros países, requiere nombre de ciudad
            if (empty($data['residence_municipality_name']) || trim($data['residence_municipality_name']) === '') {
                Response::error("Debe indicar la ciudad de residencia", 400);
            }
        }

        // VALIDACIÓN 5: Email válido
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error("El formato del email no es válido", 400);
        }

        // VALIDACIÓN 6: Teléfono válido con libphonenumber
        if (!empty($data['phone'])) {
            $phoneValidator = new PhoneValidator();

            // Extraer código de país ISO del phone_country_code (ej: +34 → ES)
            $countryISO = null;
            if (!empty($data['phone_country_code'])) {
                $countryISO = PhoneCountryMap::getCountryISO($data['phone_country_code']);
            }

            // Combinar código de país + número para validación
            // NOTA: Pasamos el teléfono tal cual. PhoneValidator se encarga de probar si necesita el código de país o si ya lo tiene.
            // Esto evita problemas cuando el usuario escribe "34600..." y seleccionó "+34", lo que resultaba en "+3434600..."
            $validation = $phoneValidator->validate($data['phone'], $countryISO);

            if (!$validation['valid']) {
                Response::error($validation['error'], 400);
            }

            // Guardar el número formateado en formato E.164
            $data['phone'] = $validation['formatted'];
        }

        // ============================================
        // SANITIZACIÓN DE DATOS
        // ============================================
        $data['first_name'] = ucwords(strtolower(trim($data['first_name'])));
        $data['last_name'] = ucwords(strtolower(trim($data['last_name'])));
        $data['second_last_name'] = isset($data['second_last_name']) ? ucwords(strtolower(trim($data['second_last_name']))) : null;
        $data['document_number'] = strtoupper(trim($data['document_number']));
        $data['support_number'] = isset($data['support_number']) ? strtoupper(trim($data['support_number'])) : null;
        $data['email'] = strtolower(trim($data['email']));

        // Convertir is_responsible a booleano
        $is_responsible = filter_var($data['is_responsible'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Si intenta marcarse como responsable, verificar que no haya otro responsable
        if ($is_responsible) {
            $existing_responsible = $viajeroModel->getResponsibleByReservation($data['reservation_id']);
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

        // CREAR VIAJERO en la nueva tabla
        $viajero_id = $viajeroModel->create($data);

        // CREAR REGISTRO EN CHECKIN (enlazar reserva con viajero)
        $checkin_id = $checkinModel->create($data['reservation_id'], $viajero_id);

        // Si es responsable, generar contrato PDF y actualizar estado de reserva
        if ($is_responsible) {
            // NOTA: No actualizamos responsible_guest_id en reservations porque
            // la FK apunta a la antigua tabla guests. El campo responsable en viajeros
            // ya indica quién es el responsable.
            // $reservationModel->setResponsibleGuest($data['reservation_id'], $viajero_id);

            // Actualizar estado de la reserva de 8 (por confirmar) a 5 (confirmado)
            // y estado_personalizado_id a 55
            try {
                $reservationModel->updateStatus($data['reservation_id'], 5, 55);
            } catch (Exception $e) {
                error_log("Error actualizando estado de reserva: " . $e->getMessage());
            }

            // Generar contrato PDF
            try {
                error_log("GUEST REGISTRATION: Iniciando generación de contrato para reserva ID: " . $data['reservation_id']);
                error_log("GUEST REGISTRATION: Viajero ID: " . $viajero_id);
                error_log("GUEST REGISTRATION: Signature path: " . ($signature_path ?? 'NULL'));
                
                $contractService = new ContractService($database);
                $contractResult = $contractService->generateContract(
                    $data['reservation_id'],
                    $viajero_id,
                    $signature_path,
                    $reservationModel  // Pasar el modelo de Reservation para guardar en tabla reserva
                );

                error_log("GUEST REGISTRATION: Contrato generado. Resultado: " . json_encode($contractResult));

                error_log("GUEST REGISTRATION: Contrato generado. Resultado: " . json_encode($contractResult));

                // El contrato ya se guardó automáticamente en la tabla reserva dentro de generateContract
                // No intentamos guardar en viajeros porque la columna contract_path no existe allí
                
            } catch (Exception $e) {
                // Log del error pero no fallar el registro
                error_log("GUEST REGISTRATION ERROR: Error generando contrato PDF: " . $e->getMessage());
                error_log("GUEST REGISTRATION ERROR: Stack trace: " . $e->getTraceAsString());
            }
        }

        // Actualizar contador de huéspedes registrados
        $reservationModel->updateRegisteredGuests($data['reservation_id']);

        $viajero = $viajeroModel->getById($viajero_id);

        Response::success($viajero, "Huésped registrado exitosamente", 201);
    }

    // GET /api/guests/{id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && is_numeric($uri_parts[$api_index + 2])) {
        $id = $uri_parts[$api_index + 2];

        $viajero = $viajeroModel->getById($id);

        if (!$viajero) {
            Response::notFound("Huésped no encontrado");
        }

        Response::success($viajero);
    }

    // GET /api/guests/reservation/{reservation_id}
    if ($method === 'GET' && isset($uri_parts[$api_index + 2]) && $uri_parts[$api_index + 2] === 'reservation') {
        $reservation_id = $uri_parts[$api_index + 3];

        $viajeros = $viajeroModel->getByReservation($reservation_id);

        Response::success($viajeros);
    }

    // PUT /api/guests/{id}
    if ($method === 'PUT' && isset($uri_parts[$api_index + 2])) {
        $id = $uri_parts[$api_index + 2];

        $viajero = $viajeroModel->getById($id);
        if (!$viajero) {
            Response::notFound("Huésped no encontrado");
        }

        $viajeroModel->update($id, $data);

        $updated_viajero = $viajeroModel->getById($id);

        Response::success($updated_viajero, "Huésped actualizado exitosamente");
    }

    Response::error("Ruta no encontrada", 404);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
