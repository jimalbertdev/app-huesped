<?php
/**
 * Configuración de la base de datos
 * Usa variables de entorno desde archivo .env
 */

// Cargar autoload de composer
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

try {
    // Cargar variables de entorno desde .env
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../..');
    $dotenv->load();

    // Validar que las variables requeridas existan
    $dotenv->required(['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS']);

} catch (Exception $e) {
    // Si no se pueden cargar las variables de entorno, terminar con error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración: No se pudo cargar archivo .env'
    ]);
    exit;
}

// Definir constantes desde variables de entorno
define('DB_HOST', $_ENV['DB_HOST']);
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);
define('DB_CHARSET', $_ENV['DB_CHARSET'] ?? 'utf8mb4');

// Configuración de zona horaria
date_default_timezone_set($_ENV['TIMEZONE'] ?? 'UTC');

// Configuración de errores según ambiente
$app_env = $_ENV['APP_ENV'] ?? 'production';
$app_debug = filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN);

if ($app_env === 'production' && !$app_debug) {
    // Producción: No mostrar errores
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
} else {
    // Development: Mostrar errores
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}
