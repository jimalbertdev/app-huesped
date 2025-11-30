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
        $sql = "INSERT INTO reserva_auditoria (
            reserva_id, id_usuario, descripcion, tipo_movimiento, accion, tipo, fecha
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        $doorName = ($door_type === 'portal') ? 'Portal' : 'Casa';
        $statusText = $success ? 'abierta correctamente' : 'falló al abrir';
        $description = "Puerta de {$doorName} {$statusText} usando el sistema de Raixer";
        
        if ($error_message) {
            $description .= ". Error: " . $error_message;
        }

        return $this->db->execute($sql, [
            $reservation_id,
            'huesped', // Usuario fijo como 'huesped'
            $description,
            'Raixer',
            'Apertura de puerta usando Raixer',
            $success ? 'true' : 'false',
            date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Obtener historial de aperturas de una reserva
     */
    public function getHistory($reservation_id, $limit = 20) {
        $sql = "SELECT
                    idreserva_auditoria as id,
                    fecha as unlock_time,
                    tipo as success_status,
                    descripcion,
                    DATE_FORMAT(fecha, '%H:%i') as time,
                    DATE_FORMAT(fecha, '%Y-%m-%d') as date
                FROM reserva_auditoria
                WHERE reserva_id = ? 
                AND id_usuario = 'huesped'
                ORDER BY fecha DESC
                LIMIT ?";

        $results = $this->db->query($sql, [$reservation_id, $limit]);
        
        // Procesar resultados para mantener compatibilidad con frontend
        return array_map(function($row) {
            // Determinar tipo de puerta basado en descripción
            $door_type = 'unknown';
            if (stripos($row['descripcion'], 'Portal') !== false) {
                $door_type = 'portal';
            } elseif (stripos($row['descripcion'], 'Casa') !== false) {
                $door_type = 'accommodation';
            }

            return [
                'id' => $row['id'],
                'unlock_time' => $row['unlock_time'],
                'door_type' => $door_type,
                'success' => $row['success_status'] === 'true' ? 1 : 0,
                'time' => $row['time'],
                'date' => $row['date'],
                'description' => $row['descripcion']
            ];
        }, $results);
    }

    /**
     * Get lock information for a reservation
     */
    public function getLockInfo($reservation_id) {
        $sql = "SELECT
                    a.id_cerradura_raixer,
                    a.informacion_portal,
                    a.informacion_casa
                FROM reserva r
                INNER JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
                WHERE r.id = ?";

        $accommodation = $this->db->queryOne($sql, [$reservation_id]);

        if (!$accommodation || !$accommodation['id_cerradura_raixer']) {
            return [
                'has_locks' => false,
                'portal' => null,
                'casa' => null,
                'portal_info' => $accommodation['informacion_portal'] ?? '',
                'casa_info' => $accommodation['informacion_casa'] ?? ''
            ];
        }

        // Get raixer device details
        $lock_id = $accommodation['id_cerradura_raixer'];

        $sql = "SELECT
                    RD.deviceId,
                    RD.name as nombre_cerradura,
                    RDO._id as DorId,
                    RDO.name as door_name
                FROM raixer_devices RD
                INNER JOIN raixer_doors RDO ON RD.deviceId = RDO.deviceId
                WHERE RD._id = ?";

        $doors = $this->db->query($sql, [$lock_id]);

        $portal = null;
        $casa = null;

        foreach ($doors as $door) {
            if ($door['door_name'] === 'Casa') {
                $casa = [
                    'device_id' => $door['deviceId'],
                    'door_id' => $door['DorId'],
                    'name' => $door['nombre_cerradura'],
                    'type' => 'casa'
                ];
            } elseif ($door['door_name'] === 'Calle') {
                $portal = [
                    'device_id' => $door['deviceId'],
                    'door_id' => $door['DorId'],
                    'name' => $door['nombre_cerradura'],
                    'type' => 'portal'
                ];
            }
        }

        return [
            'has_locks' => true,
            'portal' => $portal,
            'casa' => $casa,
            'portal_info' => html_entity_decode($accommodation['informacion_portal'] ?? ''),
            'casa_info' => html_entity_decode($accommodation['informacion_casa'] ?? '')
        ];
    }

    /**
     * Abrir puerta usando API de Raixer
     */
    public function attemptUnlock($reservation_id, $guest_id, $door_type) {
        $error_message = null;
        $success = false;

        try {
            // Get lock information
            $lockInfo = $this->getLockInfo($reservation_id);

            if (!$lockInfo['has_locks']) {
                $error_message = 'No hay cerraduras configuradas para este alojamiento';
                $this->logUnlock($reservation_id, $guest_id, $door_type, false, $error_message);
                return [
                    'success' => false,
                    'error_message' => $error_message,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }

            // Determine which door to open
            if ($door_type === 'portal' || $door_type === 'accommodation') {
                $doorType = ($door_type === 'portal') ? 'portal' : 'casa';
                $doorData = $lockInfo[$doorType];

                if (!$doorData) {
                    $error_message = "No hay puerta de tipo {$door_type} configurada";
                    $this->logUnlock($reservation_id, $guest_id, $door_type, false, $error_message);
                    return [
                        'success' => false,
                        'error_message' => $error_message,
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                }

                // Call Raixer API
                $result = $this->callRaixerAPI($doorData['device_id'], $doorData['door_id'], $doorType);

                $success = $result['success'];
                $error_message = $result['error_message'] ?? null;
            }

        } catch (Exception $e) {
            $error_message = 'Error al abrir la puerta: ' . $e->getMessage();
            error_log($error_message);
        }

        // Registrar en historial
        $this->logUnlock($reservation_id, $guest_id, $door_type, $success, $error_message);

        return [
            'success' => $success,
            'error_message' => $error_message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Call Raixer API to open door
     */
    private function callRaixerAPI($device_id, $door_id, $door_type) {
        try {
            // Raixer API credentials
            $auth = base64_encode('maxi.daniel:A529j3fG4utdLGH32uhjhh6E3g5qb2vT');

            if ($door_type === 'portal') {
                // Portal uses open-door endpoint
                $url = "https://api.raixer.com/devices/{$device_id}/open-door/{$door_id}";
            } else {
                // Casa uses gyro action endpoint
                $url = "https://api.raixer.com/devices/v2/gyro/{$device_id}/action/open";
            }

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Basic {$auth}",
                "Content-Type: application/json"
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                return [
                    'success' => false,
                    'error_message' => 'Error de conexión: ' . $error
                ];
            }

            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                return [
                    'success' => true,
                    'error_message' => null,
                    'response' => json_decode($response, true)
                ];
            } else {
                return [
                    'success' => false,
                    'error_message' => "Error HTTP {$httpCode}: No se pudo abrir la puerta"
                ];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'error_message' => 'Error al llamar API: ' . $e->getMessage()
            ];
        }
    }
}
