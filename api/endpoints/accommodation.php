<?php
/**
 * API Endpoint para obtener información del alojamiento
 * NOTA: Actualizado para usar nuevas tablas (alojamiento, informacion_externa_alojamiento, guia_local, guia_local_subcategoria)
 *
 * Endpoints:
 * - GET /api/accommodation/{accommodation_id} - Obtener toda la información del alojamiento
 * - GET /api/accommodation/{accommodation_id}/info - Solo información general
 * - GET /api/accommodation/{accommodation_id}/videos - Solo videos
 * - GET /api/accommodation/{accommodation_id}/guide - Solo guía local
 * - GET /api/accommodation/{accommodation_id}/beds - Disponibilidad de camas
 */

// Cargar las clases necesarias
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../models/BedAvailability.php';
require_once __DIR__ . '/../models/AccommodationInfo.php';
require_once __DIR__ . '/../models/LocalGuide.php';

header('Content-Type: application/json');

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $db = $database->getConnection();

    // Instanciar modelos
    $bedAvailabilityModel = new BedAvailability($database);
    $accommodationInfoModel = new AccommodationInfo($database);
    $localGuideModel = new LocalGuide($database);

    // ============================================
    // GET - Obtener información del alojamiento
    // ============================================
    if ($method === 'GET') {
        // Obtener path segments desde REQUEST_URI
        $request_uri = $_SERVER['REQUEST_URI'];
        $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
        $api_index = array_search('api', $uri_parts);

        // accommodation/3 o accommodation/3/info
        $accommodationId = isset($uri_parts[$api_index + 2]) && is_numeric($uri_parts[$api_index + 2])
            ? (int)$uri_parts[$api_index + 2]
            : null;
        $endpoint = $uri_parts[$api_index + 3] ?? 'all'; // all, info, videos, guide, beds

        if (!$accommodationId) {
            Response::error('Se requiere el ID del alojamiento', 400);
        }

        // Verificar que el alojamiento existe (usando nueva tabla 'alojamiento')
        $stmt = $db->prepare("SELECT idalojamiento, nombre FROM alojamiento WHERE idalojamiento = ?");
        $stmt->execute([$accommodationId]);
        $accommodation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$accommodation) {
            Response::error('Alojamiento no encontrado', 404);
        }

        $result = [
            'accommodation_id' => $accommodationId,
            'accommodation_name' => $accommodation['nombre']
        ];

        // ============================================
        // Obtener información general del alojamiento
        // (todo excepto videos)
        // ============================================
        if ($endpoint === 'all' || $endpoint === 'info') {
            $info = $accommodationInfoModel->getGeneralInfo($accommodationId);
            $result['info'] = $info;
        }

        // ============================================
        // Obtener videos (categoria = 8)
        // ============================================
        if ($endpoint === 'all' || $endpoint === 'videos') {
            $videos = $accommodationInfoModel->getVideos($accommodationId);
            $result['videos'] = $videos;
        }

        // ============================================
        // Obtener disponibilidad de camas
        // ============================================
        if ($endpoint === 'beds') {
            $beds = $bedAvailabilityModel->getByAccommodation($accommodationId);

            if (!$beds) {
                Response::error('No se encontró información de camas para este alojamiento', 404);
            }

            Response::success($beds, 'Disponibilidad de camas obtenida correctamente');
        }

        // ============================================
        // Obtener guía local
        // ============================================
        if ($endpoint === 'all' || $endpoint === 'guide') {
            // Obtener items de guía local agrupados por categoría
            // El modelo ya maneja la lógica de agrupación y jerarquía
            $result['guide'] = $localGuideModel->getGroupedByCategory($accommodationId);
        }

        Response::success($result, 'Información del alojamiento obtenida correctamente');
    }

    // ============================================
    // Método no permitido
    // ============================================
    else {
        Response::error('Método no permitido', 405);
    }

} catch (PDOException $e) {
    error_log("Error PDO en accommodation.php: " . $e->getMessage());
    error_log("Error detalle: " . print_r($e->errorInfo, true));
    Response::error('Error en la base de datos: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("Error Exception en accommodation.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
