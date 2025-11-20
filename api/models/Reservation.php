<?php
/**
 * Modelo de Reservas
 */

class Reservation {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Obtener reserva por código (localizador_canal)
     * NOTA: Ahora usa tabla 'reserva', 'alojamiento' y 'alojamiento_caracteristica'
     */
    public function getByCode($code) {
        $sql = "SELECT
                    r.id,
                    r.localizador_canal as reservation_code,
                    r.alojamiento_id as accommodation_id,
                    DATE(r.fecha_inicio) as check_in_date,
                    DATE(r.fecha_fin) as check_out_date,
                    r.hora_entrada as check_in_time,
                    r.total_huespedes as total_guests,
                    r.cliente_id,
                    r.estado_reserva_id as status,
                    r.created_at,
                    r.updated_at,
                    a.nombre as accommodation_name,
                    a.direccion as address,
                    CONCAT(a.direccion, ', ', a.codpostal) as city,
                    ac.redwifi as wifi_ssid,
                    ac.clavewifi as wifi_password,
                    NULL as portal_code,
                    NULL as door_code,
                    ac.nombre_anfitrion as host_name,
                    ac.email_anfitrion as host_email,
                    ac.tel_anfitrion as host_phone
                FROM reserva r
                LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
                LEFT JOIN alojamiento_caracteristica ac ON a.idalojamiento = ac.idalojamiento
                WHERE r.localizador_canal = ?";

        $result = $this->db->queryOne($sql, [$code]);

        if (!$result) {
            return null;
        }

        // Mapear estado_reserva_id a valores textuales para compatibilidad con ValidateReservation
        $result['status'] = $this->mapStatusToText($result['status']);

        // Calcular registered_guests y all_guests_registered
        $registeredCount = $this->getRegisteredGuestsCount($result['id']);
        $result['registered_guests'] = $registeredCount;
        $result['all_guests_registered'] = $registeredCount >= $result['total_guests'];

        return $result;
    }

    /**
     * Obtener reserva por ID
     */
    public function getById($id) {
        $sql = "SELECT
                    r.id,
                    r.localizador_canal as reservation_code,
                    r.alojamiento_id as accommodation_id,
                    DATE(r.fecha_inicio) as check_in_date,
                    DATE(r.fecha_fin) as check_out_date,
                    r.hora_entrada as check_in_time,
                    r.total_huespedes as total_guests,
                    r.cliente_id,
                    r.estado_reserva_id as status,
                    r.created_at,
                    r.updated_at,
                    a.nombre as accommodation_name
                FROM reserva r
                LEFT JOIN alojamiento a ON r.alojamiento_id = a.idalojamiento
                WHERE r.id = ?";

        $result = $this->db->queryOne($sql, [$id]);

        if (!$result) {
            return null;
        }

        // Mapear estado_reserva_id a valores textuales
        $result['status'] = $this->mapStatusToText($result['status']);

        // Calcular registered_guests y all_guests_registered
        $registeredCount = $this->getRegisteredGuestsCount($result['id']);
        $result['registered_guests'] = $registeredCount;
        $result['all_guests_registered'] = $registeredCount >= $result['total_guests'];

        return $result;
    }

    /**
     * Crear nueva reserva
     * NOTA: Adaptar a estructura de tabla 'reserva'
     */
    public function create($data) {
        $sql = "INSERT INTO reserva (
            alojamiento_id, localizador_canal, fecha_inicio, fecha_fin,
            hora_entrada, total_huespedes, cliente_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        $this->db->execute($sql, [
            $data['accommodation_id'],
            $data['reservation_code'],
            $data['check_in_date'],
            $data['check_out_date'],
            $data['check_in_time'] ?? '15:00:00',
            $data['total_guests'],
            $data['cliente_id'] ?? null
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Actualizar contador de huéspedes registrados
     * NOTA: Ya no se usa porque reserva no tiene campos registered_guests ni all_guests_registered
     * Estos se calculan dinámicamente en la vista v_reservations_full
     */
    public function updateRegisteredGuests($reservation_id) {
        // Esta función ya no es necesaria
        // Los campos se calculan en la vista v_reservations_full
        return true;
    }

    /**
     * Establecer huésped responsable
     * NOTA: Ya no se usa porque reserva no tiene campo responsible_guest_id
     * El responsable se marca en viajeros.responsable = 1
     */
    public function setResponsibleGuest($reservation_id, $guest_id) {
        // Esta función ya no es necesaria
        // El responsable se marca directamente en la tabla viajeros
        return true;
    }

    /**
     * Obtener cantidad de huéspedes registrados
     */
    private function getRegisteredGuestsCount($reservation_id) {
        $sql = "SELECT COUNT(*) as total
                FROM checkin c
                INNER JOIN viajeros v ON c.viajero_id = v.id
                WHERE c.reserva_id = ?";

        $result = $this->db->queryOne($sql, [$reservation_id]);
        return $result ? (int)$result['total'] : 0;
    }

    /**
     * Obtener información del alojamiento de la reserva
     */
    public function getAccommodationInfo($reservation_id) {
        $sql = "SELECT a.*, h.name as host_name, h.email as host_email, h.phone as host_phone, h.available_24_7
                FROM reserva r
                JOIN accommodations a ON r.alojamiento_id = a.id
                JOIN hosts h ON a.host_id = h.id
                WHERE r.id = ?";

        return $this->db->queryOne($sql, [$reservation_id]);
    }

    /**
     * Verificar si todos los huéspedes están registrados
     */
    public function areAllGuestsRegistered($reservation_id) {
        $reservation = $this->getById($reservation_id);
        return $reservation && $reservation['all_guests_registered'] == 1;
    }

    /**
     * Actualizar estado de la reserva
     * @param int $reservation_id ID de la reserva
     * @param int $status_id ID del estado (5 = confirmado, 8 = por confirmar, etc.)
     * @param int|null $custom_status_id ID del estado personalizado (opcional)
     */
    public function updateStatus($reservation_id, $status_id, $custom_status_id = null) {
        if ($custom_status_id !== null) {
            $sql = "UPDATE reserva SET estado_reserva_id = ?, estado_personalizado_id = ? WHERE id = ?";
            return $this->db->execute($sql, [$status_id, $custom_status_id, $reservation_id]);
        } else {
            $sql = "UPDATE reserva SET estado_reserva_id = ? WHERE id = ?";
            return $this->db->execute($sql, [$status_id, $reservation_id]);
        }
    }

    /**
     * Mapear estado_reserva_id (ID numérico) a valores textuales
     * para compatibilidad con ValidateReservation middleware
     */
    private function mapStatusToText($status_id) {
        // Mapeo basado en los estados de tu sistema:
        // 5 = confirmado/active
        // 8 = por confirmar/pending
        $statusMap = [
            5 => 'confirmed',    // Confirmado (después de registrar responsable)
            8 => 'confirmed',    // Por confirmar (permitir acceso durante registro)
            // Agregar más estados según necesites
        ];

        return $statusMap[$status_id] ?? 'confirmed'; // Por defecto, permitir acceso
    }
}
