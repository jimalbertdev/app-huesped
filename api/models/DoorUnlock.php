<?php
/**
 * Modelo de Apertura de Puertas
 */

class DoorUnlock {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Registrar intento de apertura de puerta
     */
    public function logUnlock($reservation_id, $guest_id, $door_type, $success, $error_message = null) {
        $sql = "INSERT INTO door_unlocks (
            reservation_id, guest_id, door_type, success,
            ip_address, device_info, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        return $this->db->execute($sql, [
            $reservation_id,
            $guest_id,
            $door_type,
            $success ? 1 : 0,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $error_message
        ]);
    }

    /**
     * Obtener historial de aperturas de una reserva
     */
    public function getHistory($reservation_id, $limit = 20) {
        $sql = "SELECT
                    d.*,
                    g.first_name,
                    g.last_name,
                    DATE_FORMAT(d.unlock_time, '%H:%i') as time,
                    DATE_FORMAT(d.unlock_time, '%Y-%m-%d') as date
                FROM door_unlocks d
                LEFT JOIN guests g ON d.guest_id = g.id
                WHERE d.reservation_id = ?
                ORDER BY d.unlock_time DESC
                LIMIT ?";

        return $this->db->query($sql, [$reservation_id, $limit]);
    }

    /**
     * Simular apertura de puerta (integración con sistema de cerradura)
     * En producción, aquí iría la integración real con el hardware
     */
    public function attemptUnlock($reservation_id, $guest_id, $door_type) {
        // Simulación: 70% de éxito
        $success = (rand(1, 100) <= 70);

        $error_message = null;
        if (!$success) {
            $errors = [
                'Timeout de conexión con la cerradura',
                'Batería baja en la cerradura',
                'Error de autenticación',
                'Cerradura bloqueada temporalmente'
            ];
            $error_message = $errors[array_rand($errors)];
        }

        // Registrar en historial
        $this->logUnlock($reservation_id, $guest_id, $door_type, $success, $error_message);

        return [
            'success' => $success,
            'error_message' => $error_message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
