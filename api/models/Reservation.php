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
     * Obtener reserva por código
     */
    public function getByCode($code) {
        $sql = "SELECT * FROM v_reservations_full WHERE reservation_code = ?";
        return $this->db->queryOne($sql, [$code]);
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
                    SELECT COUNT(*) FROM guests WHERE reservation_id = r.id AND is_registered = 1
                ),
                all_guests_registered = (
                    SELECT COUNT(*) FROM guests WHERE reservation_id = r.id AND is_registered = 1
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
