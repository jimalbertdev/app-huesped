<?php
/**
 * API Endpoint para gestión de preferencias de estancia
 *
 * Endpoints:
 * - GET /api/preferences/{reservation_id} - Obtener preferencias de una reserva
 * - POST /api/preferences - Crear o actualizar preferencias
 */

require_once __DIR__ . '/bootstrap.php';

use App\Core\Database;
use App\Core\Response;
use App\Core\Validator;

header('Content-Type: application/json');

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getInstance()->getConnection();

    // ============================================
    // GET - Obtener preferencias de una reserva
    // ============================================
    if ($method === 'GET') {
        // Obtener reservation_id del path: /api/preferences/{reservation_id}
        $pathParts = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
        $reservationId = isset($pathParts[0]) && is_numeric($pathParts[0]) ? (int)$pathParts[0] : null;

        if (!$reservationId) {
            Response::error('Se requiere el ID de la reserva', 400);
        }

        // Verificar que la reserva existe
        $stmt = $db->prepare("SELECT id FROM reservations WHERE id = ?");
        $stmt->execute([$reservationId]);
        if (!$stmt->fetch()) {
            Response::error('Reserva no encontrada', 404);
        }

        // Obtener preferencias
        $stmt = $db->prepare("
            SELECT
                id,
                reservation_id,
                needs_crib,
                double_beds,
                single_beds,
                sofa_beds,
                estimated_arrival_time,
                additional_info,
                allergies,
                special_requests,
                created_at,
                updated_at
            FROM preferences
            WHERE reservation_id = ?
        ");
        $stmt->execute([$reservationId]);
        $preferences = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($preferences) {
            // Convertir tinyint a boolean
            $preferences['needs_crib'] = (bool)$preferences['needs_crib'];
            Response::success($preferences, 'Preferencias obtenidas correctamente');
        } else {
            // No hay preferencias, devolver valores por defecto
            Response::success([
                'reservation_id' => $reservationId,
                'needs_crib' => false,
                'double_beds' => 0,
                'single_beds' => 0,
                'sofa_beds' => 0,
                'estimated_arrival_time' => null,
                'additional_info' => null,
                'allergies' => null,
                'special_requests' => null
            ], 'No hay preferencias guardadas');
        }
    }

    // ============================================
    // POST - Crear o actualizar preferencias
    // ============================================
    elseif ($method === 'POST') {
        // Leer datos del body
        $input = json_decode(file_get_contents('php://input'), true);

        // DEBUG: Ver qué llega del frontend
        error_log("DEBUG POST /api/preferences - Input recibido: " . json_encode($input));
        error_log("DEBUG needs_crib valor: " . var_export($input['needs_crib'] ?? 'NO_EXISTE', true) . " tipo: " . gettype($input['needs_crib'] ?? null));

        if (!$input) {
            Response::error('Datos inválidos', 400);
        }

        // Validar campos requeridos
        $validator = new Validator($input);
        $validator->required('reservation_id')->numeric();

        if (!$validator->isValid()) {
            Response::error('Datos de validación incorrectos', 400, $validator->getErrors());
        }

        $reservationId = (int)$input['reservation_id'];

        // Verificar que la reserva existe
        $stmt = $db->prepare("SELECT id FROM reservations WHERE id = ?");
        $stmt->execute([$reservationId]);
        if (!$stmt->fetch()) {
            Response::error('Reserva no encontrada', 404);
        }

        // Preparar datos (con valores por defecto)
        // Convertir boolean a int (0 o 1) para MySQL
        // Manejar empty string, false, 0, null como 0
        $needsCrib = (!empty($input['needs_crib']) && $input['needs_crib'] !== false && $input['needs_crib'] !== '0') ? 1 : 0;
        $doubleBeds = isset($input['double_beds']) && $input['double_beds'] !== '' ? (int)$input['double_beds'] : 0;
        $singleBeds = isset($input['single_beds']) && $input['single_beds'] !== '' ? (int)$input['single_beds'] : 0;
        $sofaBeds = isset($input['sofa_beds']) && $input['sofa_beds'] !== '' ? (int)$input['sofa_beds'] : 0;
        $estimatedArrivalTime = !empty($input['estimated_arrival_time']) ? $input['estimated_arrival_time'] : null;
        $additionalInfo = !empty($input['additional_info']) ? $input['additional_info'] : null;
        $allergies = !empty($input['allergies']) ? $input['allergies'] : null;
        $specialRequests = !empty($input['special_requests']) ? $input['special_requests'] : null;

        // Verificar si ya existen preferencias para esta reserva
        $stmt = $db->prepare("SELECT id FROM preferences WHERE reservation_id = ?");
        $stmt->execute([$reservationId]);
        $existingPreferences = $stmt->fetch();

        if ($existingPreferences) {
            // UPDATE - Actualizar preferencias existentes

            // Debug logging
            error_log("DEBUG preferences.php - Valores antes de UPDATE:");
            error_log("needsCrib: " . var_export($needsCrib, true) . " type: " . gettype($needsCrib));
            error_log("doubleBeds: " . var_export($doubleBeds, true) . " type: " . gettype($doubleBeds));
            error_log("Input original: " . json_encode($input));

            $stmt = $db->prepare("
                UPDATE preferences SET
                    needs_crib = ?,
                    double_beds = ?,
                    single_beds = ?,
                    sofa_beds = ?,
                    estimated_arrival_time = ?,
                    additional_info = ?,
                    allergies = ?,
                    special_requests = ?,
                    updated_at = NOW()
                WHERE reservation_id = ?
            ");

            $stmt->execute([
                $needsCrib,
                $doubleBeds,
                $singleBeds,
                $sofaBeds,
                $estimatedArrivalTime,
                $additionalInfo,
                $allergies,
                $specialRequests,
                $reservationId
            ]);

            // Obtener preferencias actualizadas
            $stmt = $db->prepare("SELECT * FROM preferences WHERE reservation_id = ?");
            $stmt->execute([$reservationId]);
            $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
            $preferences['needs_crib'] = (bool)$preferences['needs_crib'];

            Response::success($preferences, 'Preferencias actualizadas correctamente', 200);
        } else {
            // INSERT - Crear nuevas preferencias
            $stmt = $db->prepare("
                INSERT INTO preferences (
                    reservation_id,
                    needs_crib,
                    double_beds,
                    single_beds,
                    sofa_beds,
                    estimated_arrival_time,
                    additional_info,
                    allergies,
                    special_requests
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $reservationId,
                $needsCrib,
                $doubleBeds,
                $singleBeds,
                $sofaBeds,
                $estimatedArrivalTime,
                $additionalInfo,
                $allergies,
                $specialRequests
            ]);

            $preferenceId = $db->lastInsertId();

            // Obtener preferencias creadas
            $stmt = $db->prepare("SELECT * FROM preferences WHERE id = ?");
            $stmt->execute([$preferenceId]);
            $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
            $preferences['needs_crib'] = (bool)$preferences['needs_crib'];

            Response::success($preferences, 'Preferencias creadas correctamente', 201);
        }
    }

    // ============================================
    // Método no permitido
    // ============================================
    else {
        Response::error('Método no permitido', 405);
    }

} catch (PDOException $e) {
    error_log("Error PDO en preferences.php: " . $e->getMessage());
    error_log("Error detalle: " . print_r($e->errorInfo, true));
    Response::error('Error en la base de datos: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("Error Exception en preferences.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
