<?php
/**
 * Clase helper para respuestas JSON estandarizadas
 */

require_once __DIR__ . '/Logger.php';

class Response {

    /**
     * Verificar si estamos en modo de producción
     */
    private static function isProduction() {
        $env = $_ENV['APP_ENV'] ?? 'production';
        $debug = filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN);
        return ($env === 'production' && !$debug);
    }

    /**
     * Enviar respuesta de éxito
     */
    public static function success($data = null, $message = "Operación exitosa", $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);

        // Log de operaciones exitosas importantes
        if ($code === 201) {
            Logger::info($message, ['data' => $data]);
        }

        exit;
    }

    /**
     * Enviar respuesta de error
     */
    public static function error($message = "Error en la operación", $code = 400, $errors = null) {
        // Loguear el error
        Logger::warning("Error en API: $message", [
            'code' => $code,
            'errors' => $errors
        ]);

        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Error 404 - No encontrado
     */
    public static function notFound($message = "Recurso no encontrado") {
        self::error($message, 404);
    }

    /**
     * Error 401 - No autorizado
     */
    public static function unauthorized($message = "No autorizado") {
        Logger::security("Intento de acceso no autorizado: $message");
        self::error($message, 401);
    }

    /**
     * Error 500 - Error del servidor
     */
    public static function serverError($message = "Error interno del servidor", $exception = null) {
        // Loguear el error detalladamente
        $context = [];
        if ($exception instanceof Exception) {
            $context['exception'] = $exception;
        }
        Logger::error("Error del servidor: $message", $context);

        // En producción, no exponer detalles del error
        if (self::isProduction()) {
            $message = "Ha ocurrido un error. Por favor, contacta con soporte si el problema persiste.";
        }

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Validar datos requeridos
     */
    public static function validateRequired($data, $required_fields) {
        $missing = [];

        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            self::error(
                "Faltan campos requeridos",
                422,
                ['missing_fields' => $missing]
            );
        }
    }
}
