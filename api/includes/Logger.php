<?php
/**
 * Logger - Sistema de logging estructurado
 * Registra eventos, errores y actividades de seguridad
 */

class Logger {
    private static $log_file = null;
    private static $log_level = 'debug';

    /**
     * Niveles de log según severidad
     */
    const LEVELS = [
        'debug' => 0,
        'info' => 1,
        'warning' => 2,
        'error' => 3,
        'critical' => 4,
        'security' => 5
    ];

    /**
     * Inicializar el logger
     */
    private static function init() {
        if (self::$log_file === null) {
            self::$log_file = $_ENV['LOG_FILE'] ?? __DIR__ . '/../../logs/app.log';
            self::$log_level = strtolower($_ENV['LOG_LEVEL'] ?? 'debug');
        }
    }

    /**
     * Escribir entrada de log
     *
     * @param string $level Nivel de severidad
     * @param string $message Mensaje principal
     * @param array $context Datos adicionales de contexto
     */
    private static function write($level, $message, $context = []) {
        self::init();

        // Verificar si este nivel debe ser logueado
        $current_level = self::LEVELS[self::$log_level] ?? 0;
        $message_level = self::LEVELS[$level] ?? 0;

        if ($message_level < $current_level) {
            return; // No loguear este nivel
        }

        // Preparar entrada de log
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'ip' => self::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ];

        // Agregar información de error si existe
        if (isset($context['exception']) && $context['exception'] instanceof Exception) {
            $log_entry['exception'] = [
                'message' => $context['exception']->getMessage(),
                'file' => $context['exception']->getFile(),
                'line' => $context['exception']->getLine(),
                'trace' => $context['exception']->getTraceAsString()
            ];
            unset($context['exception']);
        }

        // Escribir al archivo
        $json_entry = json_encode($log_entry, JSON_UNESCAPED_UNICODE) . PHP_EOL;
        @file_put_contents(self::$log_file, $json_entry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Log nivel DEBUG
     */
    public static function debug($message, $context = []) {
        self::write('debug', $message, $context);
    }

    /**
     * Log nivel INFO
     */
    public static function info($message, $context = []) {
        self::write('info', $message, $context);
    }

    /**
     * Log nivel WARNING
     */
    public static function warning($message, $context = []) {
        self::write('warning', $message, $context);
    }

    /**
     * Log nivel ERROR
     */
    public static function error($message, $context = []) {
        self::write('error', $message, $context);
    }

    /**
     * Log nivel CRITICAL
     */
    public static function critical($message, $context = []) {
        self::write('critical', $message, $context);
    }

    /**
     * Log de eventos de seguridad
     */
    public static function security($message, $context = []) {
        self::write('security', $message, $context);
    }

    /**
     * Obtener IP real del cliente
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
                    if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
                        return $ip;
                    }
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}
