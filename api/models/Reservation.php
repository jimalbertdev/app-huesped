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
     * NOTA: Ahora usa tabla 'reserva' en lugar de 'reservations'
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
                    r.created_at,
                    r.updated_at,
                    a.name as accommodation_name,
                    a.address,
                    a.city,
                    a.wifi_name as wifi_ssid,
                    a.wifi_password,
                    a.building_code as portal_code,
                    NULL as door_code
                FROM reserva r
                LEFT JOIN accommodations a ON r.alojamiento_id = a.id
                WHERE r.localizador_canal = ?";

        $result = $this->db->queryOne($sql, [$code]);

        if (!$result) {
            return null;
        }

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
        $sql = "SELECT * FROM v_reservations_full WHERE id = ?";
        return $this->db->queryOne($sql, [$id]);
    }

    /**
     * Crear nueva reserva
     */
    public function create($data) {
        $sql = "INSERT INTO reservations (
            accommodation_id, reservation_code, check_in_date, check_out_date,
            check_in_time, total_guests, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        $this->db->execute($sql, [
            $data['accommodation_id'],
            $data['reservation_code'],
            $data['check_in_date'],
            $data['check_out_date'],
            $data['check_in_time'] ?? '15:00:00',
            $data['total_guests'],
            $data['status'] ?? 'confirmed'
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Actualizar contador de huéspedes registrados
     */
    public function updateRegisteredGuests($reservation_id) {
        $sql = "UPDATE reservations r
                SET registered_guests = (
                    SELECT COUNT(*)
                    FROM checkin c
                    INNER JOIN viajeros v ON c.viajero_id = v.id
                    WHERE c.reserva_id = r.id
                ),
                all_guests_registered = (
                    SELECT COUNT(*)
                    FROM checkin c
                    INNER JOIN viajeros v ON c.viajero_id = v.id
                    WHERE c.reserva_id = r.id
                ) >= r.total_guests
                WHERE r.id = ?";

        return $this->db->execute($sql, [$reservation_id]);
    }

    /**
     * Establecer huésped responsable
     */
    public function setResponsibleGuest($reservation_id, $guest_id) {
        $sql = "UPDATE reservations SET responsible_guest_id = ? WHERE id = ?";
        return $this->db->execute($sql, [$guest_id, $reservation_id]);
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
                FROM reservations r
                JOIN accommodations a ON r.accommodation_id = a.id
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
}
