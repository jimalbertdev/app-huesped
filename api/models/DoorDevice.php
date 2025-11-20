<?php
class DoorDevice {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get door devices for an accommodation
     * @param int $accommodation_id
     * @return array
     */
    public function getByAccommodationId($accommodation_id) {
        try {
            $query = "
                SELECT
                    a.id_cerradura_raixer,
                    a.informacion_portal,
                    a.informacion_casa
                FROM alojamientos a
                WHERE a.id = :accommodation_id
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute(['accommodation_id' => $accommodation_id]);
            $accommodation = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$accommodation || !$accommodation['id_cerradura_raixer']) {
                return [
                    'has_locks' => false,
                    'portal' => null,
                    'casa' => null,
                    'portal_info' => $accommodation['informacion_portal'] ?? '',
                    'casa_info' => $accommodation['informacion_casa'] ?? ''
                ];
            }

            // Query raixer devices table
            $lockId = $accommodation['id_cerradura_raixer'];

            $query = "
                SELECT
                    RD.deviceId,
                    RD.name as nombre_cerradura,
                    RDO._id as DorId,
                    RDO.name
                FROM raixer_devices RD
                INNER JOIN raixer_doors RDO ON RD.deviceId = RDO.deviceId
                WHERE RD._id = :lock_id
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute(['lock_id' => $lockId]);
            $doors = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $portal = null;
            $casa = null;

            foreach ($doors as $door) {
                if ($door['name'] === 'Casa') {
                    $casa = [
                        'device_id' => $door['deviceId'],
                        'door_id' => $door['DorId'],
                        'name' => $door['nombre_cerradura'],
                        'type' => 'casa'
                    ];
                } elseif ($door['name'] === 'Calle') {
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
                'portal_info' => $accommodation['informacion_portal'] ?? '',
                'casa_info' => $accommodation['informacion_casa'] ?? ''
            ];

        } catch (PDOException $e) {
            error_log("Error getting door devices: " . $e->getMessage());
            return [
                'has_locks' => false,
                'portal' => null,
                'casa' => null,
                'portal_info' => '',
                'casa_info' => ''
            ];
        }
    }

    /**
     * Open a door via Raixer API
     * @param string $device_id
     * @param string $door_id
     * @param string $door_type 'portal' or 'casa'
     * @return array
     */
    public function openDoor($device_id, $door_id, $door_type) {
        try {
            // Raixer API credentials (consider moving to config)
            $auth = base64_encode('maxi.daniel:A529j3fG4utdLGH32uhjhh6E3g5qb2vT');

            if ($door_type === 'portal') {
                // Portal uses open-door endpoint
                $url = "https://api.raixer.com/devices/{$device_id}/open-door/{$door_id}";
                $method = 'POST';
            } else {
                // Casa uses gyro action endpoint
                $url = "https://api.raixer.com/devices/v2/gyro/{$device_id}/action/open";
                $method = 'POST';
            }

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Basic {$auth}",
                "Content-Type: application/json"
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                return [
                    'success' => true,
                    'message' => 'Door opened successfully',
                    'response' => json_decode($response, true)
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to open door',
                    'http_code' => $httpCode,
                    'response' => $response
                ];
            }

        } catch (Exception $e) {
            error_log("Error opening door: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error opening door: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Log door unlock attempt
     * @param int $reservation_id
     * @param string $door_type
     * @param bool $success
     * @param string $description
     * @return bool
     */
    public function logUnlockAttempt($reservation_id, $door_type, $success, $description = '') {
        try {
            $status = $success ? 'success' : 'failed';

            $query = "
                INSERT INTO door_unlocks
                (reservation_id, door_type, status, unlock_time, description, created_at, updated_at)
                VALUES
                (:reservation_id, :door_type, :status, NOW(), :description, NOW(), NOW())
            ";

            $stmt = $this->db->prepare($query);
            return $stmt->execute([
                'reservation_id' => $reservation_id,
                'door_type' => $door_type,
                'status' => $status,
                'description' => $description
            ]);

        } catch (PDOException $e) {
            error_log("Error logging unlock attempt: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get unlock history for a reservation
     * @param int $reservation_id
     * @return array
     */
    public function getUnlockHistory($reservation_id) {
        try {
            $query = "
                SELECT
                    id,
                    door_type,
                    status,
                    unlock_time,
                    description,
                    created_at
                FROM door_unlocks
                WHERE reservation_id = :reservation_id
                ORDER BY unlock_time DESC
                LIMIT 50
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute(['reservation_id' => $reservation_id]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            error_log("Error getting unlock history: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Update reservation status when guest enters accommodation
     * @param int $reservation_id
     * @return bool
     */
    public function markAccommodationEntered($reservation_id) {
        try {
            // Update reservation to indicate guest has entered
            $query = "
                UPDATE reserva
                SET estado_reserva_id = 5,
                    updated_at = NOW()
                WHERE id = :reservation_id
            ";

            $stmt = $this->db->prepare($query);
            $result = $stmt->execute(['reservation_id' => $reservation_id]);

            if ($result) {
                // Log the entry
                $this->logUnlockAttempt(
                    $reservation_id,
                    'casa',
                    true,
                    'Huésped ha ingresado al alojamiento'
                );
            }

            return $result;

        } catch (PDOException $e) {
            error_log("Error marking accommodation entered: " . $e->getMessage());
            return false;
        }
    }
}
