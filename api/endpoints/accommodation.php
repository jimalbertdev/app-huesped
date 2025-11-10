<?php
/**
 * API Endpoint para obtener información del alojamiento
 *
 * Endpoints:
 * - GET /api/accommodation/{accommodation_id} - Obtener toda la información del alojamiento
 * - GET /api/accommodation/{accommodation_id}/info - Solo información general
 * - GET /api/accommodation/{accommodation_id}/videos - Solo videos
 * - GET /api/accommodation/{accommodation_id}/guide - Solo guía local
 */

// Cargar las clases necesarias
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';

header('Content-Type: application/json');

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $db = $database->getConnection();

    // ============================================
    // GET - Obtener información del alojamiento
    // ============================================
    if ($method === 'GET') {
        // Obtener path segments desde REQUEST_URI
        $request_uri = $_SERVER['REQUEST_URI'];
        $uri_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
        $api_index = array_search('api', $uri_parts);

        // accommodation/1 o accommodation/1/info
        $accommodationId = isset($uri_parts[$api_index + 2]) && is_numeric($uri_parts[$api_index + 2])
            ? (int)$uri_parts[$api_index + 2]
            : null;
        $endpoint = $uri_parts[$api_index + 3] ?? 'all'; // all, info, videos, guide

        if (!$accommodationId) {
            Response::error('Se requiere el ID del alojamiento', 400);
        }

        // Verificar que el alojamiento existe
        $stmt = $db->prepare("SELECT id, name FROM accommodations WHERE id = ?");
        $stmt->execute([$accommodationId]);
        $accommodation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$accommodation) {
            Response::error('Alojamiento no encontrado', 404);
        }

        $result = [
            'accommodation_id' => $accommodationId,
            'accommodation_name' => $accommodation['name']
        ];

        // Obtener información general del alojamiento
        if ($endpoint === 'all' || $endpoint === 'info') {
            $stmt = $db->prepare("
                SELECT
                    id,
                    how_to_arrive_airport,
                    how_to_arrive_car,
                    building_access_code,
                    amenities,
                    wifi_network,
                    wifi_password,
                    heating_info,
                    tv_info,
                    other_instructions,
                    check_in_time,
                    check_out_time,
                    rules
                FROM accommodation_info
                WHERE accommodation_id = ?
            ");
            $stmt->execute([$accommodationId]);
            $info = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($info) {
                // Parsear rules si es JSON
                if (!empty($info['rules'])) {
                    $info['rules'] = json_decode($info['rules'], true);
                }
                $result['info'] = $info;
            } else {
                $result['info'] = null;
            }
        }

        // Obtener videos
        if ($endpoint === 'all' || $endpoint === 'videos') {
            $stmt = $db->prepare("
                SELECT
                    id,
                    title,
                    description,
                    video_url,
                    video_type,
                    display_order
                FROM accommodation_videos
                WHERE accommodation_id = ?
                  AND is_active = 1
                ORDER BY display_order ASC
            ");
            $stmt->execute([$accommodationId]);
            $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $result['videos'] = $videos;
        }

        // Obtener guía local
        if ($endpoint === 'all' || $endpoint === 'guide') {
            // Obtener todas las categorías con sus items
            $stmt = $db->prepare("
                SELECT
                    c.id as category_id,
                    c.category_key,
                    c.title_es,
                    c.title_en,
                    c.title_fr,
                    c.icon,
                    c.display_order as category_order
                FROM accommodation_guide_categories c
                WHERE c.is_active = 1
                ORDER BY c.display_order ASC
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Para cada categoría, obtener sus items
            $guide = [];
            foreach ($categories as $category) {
                $stmt = $db->prepare("
                    SELECT
                        id,
                        name,
                        description,
                        distance,
                        rating,
                        address,
                        phone,
                        website,
                        display_order
                    FROM accommodation_guide_items
                    WHERE accommodation_id = ?
                      AND category_id = ?
                      AND is_active = 1
                    ORDER BY display_order ASC
                ");
                $stmt->execute([$accommodationId, $category['category_id']]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Solo incluir la categoría si tiene items
                if (!empty($items)) {
                    $guide[] = [
                        'id' => $category['category_key'],
                        'category_id' => $category['category_id'],
                        'title' => [
                            'es' => $category['title_es'],
                            'en' => $category['title_en'],
                            'fr' => $category['title_fr']
                        ],
                        'icon' => $category['icon'],
                        'items' => $items
                    ];
                }
            }
            $result['guide'] = $guide;
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
