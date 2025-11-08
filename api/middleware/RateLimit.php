<?php
/**
 * Rate Limiting Middleware
 * Limita el número de peticiones por IP en un período de tiempo
 * Implementación basada en archivos (no requiere Redis)
 */

class RateLimit {
    private static $storage_path = '/tmp/vacanfly_rate_limit/';

    /**
     * Inicializar el directorio de almacenamiento
     */
    private static function init() {
        if (!file_exists(self::$storage_path)) {
            mkdir(self::$storage_path, 0777, true);
        }
    }

    /**
     * Limpiar archivos antiguos (llamar periódicamente)
     */
    private static function cleanup() {
        if (!file_exists(self::$storage_path)) {
            return;
        }

        $files = glob(self::$storage_path . '*');
        $now = time();

        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > 3600) {
                @unlink($file);
            }
        }
    }

    /**
     * Verificar y aplicar rate limit
     *
     * @param string $identifier Identificador único (normalmente IP)
     * @param int $max_requests Número máximo de peticiones permitidas
     * @param int $window Ventana de tiempo en segundos (por defecto 60)
     * @param string $action Acción específica (opcional, para límites por endpoint)
     * @return bool True si la petición está permitida, false si excede el límite
     */
    public static function check($identifier, $max_requests = 100, $window = 60, $action = 'general') {
        self::init();

        // Limpiar archivos antiguos (5% de probabilidad para no hacerlo en cada request)
        if (rand(1, 100) <= 5) {
            self::cleanup();
        }

        // Crear nombre de archivo único para este identificador y acción
        $key = md5($identifier . '_' . $action);
        $file = self::$storage_path . $key;

        // Obtener datos actuales
        $data = self::getData($file);
        $now = time();

        // Si no hay datos o la ventana ha expirado, reiniciar
        if ($data === null || ($now - $data['timestamp']) > $window) {
            $data = [
                'timestamp' => $now,
                'count' => 1,
                'window' => $window
            ];
            self::saveData($file, $data);
            return true;
        }

        // Si está dentro de la ventana, verificar el límite
        if ($data['count'] >= $max_requests) {
            // Límite excedido
            $remaining_time = $window - ($now - $data['timestamp']);
            self::sendRateLimitResponse($remaining_time);
            return false;
        }

        // Incrementar contador
        $data['count']++;
        self::saveData($file, $data);
        return true;
    }

    /**
     * Obtener datos del archivo
     */
    private static function getData($file) {
        if (!file_exists($file)) {
            return null;
        }

        $content = @file_get_contents($file);
        if ($content === false) {
            return null;
        }

        $data = @json_decode($content, true);
        return $data ?: null;
    }

    /**
     * Guardar datos en el archivo
     */
    private static function saveData($file, $data) {
        @file_put_contents($file, json_encode($data), LOCK_EX);
    }

    /**
     * Enviar respuesta de límite excedido
     */
    private static function sendRateLimitResponse($remaining_time) {
        http_response_code(429);
        header('Retry-After: ' . $remaining_time);
        echo json_encode([
            'success' => false,
            'message' => 'Demasiadas peticiones. Por favor, intenta de nuevo en ' . $remaining_time . ' segundos.',
            'error_code' => 'RATE_LIMIT_EXCEEDED',
            'retry_after' => $remaining_time
        ]);
        exit;
    }

    /**
     * Aplicar rate limit usando configuración de .env
     *
     * @param string $action Tipo de acción (general, door_unlock, incidents, guests)
     */
    public static function apply($action = 'general') {
        $ip = self::getClientIP();

        // Obtener límites desde .env
        $limits = [
            'general' => intval($_ENV['RATE_LIMIT_GENERAL'] ?? 100),
            'door_unlock' => intval($_ENV['RATE_LIMIT_DOOR_UNLOCK'] ?? 10),
            'incidents' => intval($_ENV['RATE_LIMIT_INCIDENTS'] ?? 5),
            'guests' => intval($_ENV['RATE_LIMIT_GUESTS'] ?? 20)
        ];

        $max_requests = $limits[$action] ?? $limits['general'];

        return self::check($ip, $max_requests, 60, $action);
    }

    /**
     * Obtener la IP real del cliente
     */
    private static function getClientIP() {
        $ip_keys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER)) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}
