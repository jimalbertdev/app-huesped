<?php
/**
 * Configuración de CORS (Cross-Origin Resource Sharing)
 * Solo permite peticiones desde orígenes configurados en .env
 */

// Asegurar que las variables de entorno estén cargadas
if (!isset($_ENV['ALLOWED_ORIGINS'])) {
    // Si no hay configuración, denegar todo
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Configuración CORS no disponible'
    ]);
    exit;
}

// Obtener lista de orígenes permitidos desde .env
$allowed_origins = array_map('trim', explode(',', $_ENV['ALLOWED_ORIGINS']));

// Obtener el origen de la petición
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Validar si el origen está en la lista permitida
if (in_array($origin, $allowed_origins)) {
    // Permitir este origen específico
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Si el origen no está permitido, no establecer el header
    // Esto causará que el navegador bloquee la petición CORS
    header("Access-Control-Allow-Origin: null");
}

// Métodos HTTP permitidos
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Headers permitidos en las peticiones
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Permitir credenciales (cookies, headers de auth)
header("Access-Control-Allow-Credentials: true");

// Tiempo de cache para preflight requests (1 hora)
header("Access-Control-Max-Age: 3600");

// Tipo de contenido
header("Content-Type: application/json; charset=UTF-8");

// Manejar preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
