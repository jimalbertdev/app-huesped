<?php
/**
 * Modelo de Preferencias
 */

class Preference {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Crear o actualizar preferencias de una reserva
     */
    public function upsert($reservation_id, $data) {
        // Verificar si ya existen preferencias
        $existing = $this->getByReservation($reservation_id);

        if ($existing) {
            return $this->update($reservation_id, $data);
        } else {
            return $this->create($reservation_id, $data);
        }
    }

    /**
     * Crear preferencias
     */
    private function create($reservation_id, $data) {
        $sql = "INSERT INTO preferences (
            reservation_id, needs_crib, double_beds, single_beds, sofa_beds,
            estimated_arrival_time, additional_info, allergies, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        return $this->db->execute($sql, [
            $reservation_id,
            $data['needs_crib'] ?? false,
            $data['double_beds'] ?? 0,
            $data['single_beds'] ?? 0,
            $data['sofa_beds'] ?? 0,
            $data['estimated_arrival_time'] ?? null,
            $data['additional_info'] ?? null,
            $data['allergies'] ?? null,
            $data['special_requests'] ?? null
        ]);
    }

    /**
     * Actualizar preferencias
     */
    private function update($reservation_id, $data) {
        $sql = "UPDATE preferences SET
            needs_crib = ?,
            double_beds = ?,
            single_beds = ?,
            sofa_beds = ?,
            estimated_arrival_time = ?,
            additional_info = ?,
            allergies = ?,
            special_requests = ?,
            updated_at = NOW()
            WHERE reservation_id = ?";

        return $this->db->execute($sql, [
            $data['needs_crib'] ?? false,
            $data['double_beds'] ?? 0,
            $data['single_beds'] ?? 0,
            $data['sofa_beds'] ?? 0,
            $data['estimated_arrival_time'] ?? null,
            $data['additional_info'] ?? null,
            $data['allergies'] ?? null,
            $data['special_requests'] ?? null,
            $reservation_id
        ]);
    }

    /**
     * Obtener preferencias de una reserva
     */
    public function getByReservation($reservation_id) {
        $sql = "SELECT * FROM preferences WHERE reservation_id = ?";
        return $this->db->queryOne($sql, [$reservation_id]);
    }
}
