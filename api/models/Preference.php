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
            reservation_id, needs_crib, double_beds, single_beds, sofa_beds, bunk_beds,
            estimated_arrival_time, additional_info, allergies, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // Convertir needs_crib a int (0 o 1) de forma robusta
        $needsCrib = $this->convertToInt($data['needs_crib'] ?? false);

        return $this->db->execute($sql, [
            $reservation_id,
            $needsCrib,
            $data['double_beds'] ?? 0,
            $data['single_beds'] ?? 0,
            $data['sofa_beds'] ?? 0,
            $data['bunk_beds'] ?? 0,
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
            bunk_beds = ?,
            estimated_arrival_time = ?,
            additional_info = ?,
            allergies = ?,
            special_requests = ?,
            updated_at = NOW()
            WHERE reservation_id = ?";

        // Convertir needs_crib a int (0 o 1) de forma robusta
        $needsCrib = $this->convertToInt($data['needs_crib'] ?? false);

        return $this->db->execute($sql, [
            $needsCrib,
            $data['double_beds'] ?? 0,
            $data['single_beds'] ?? 0,
            $data['sofa_beds'] ?? 0,
            $data['bunk_beds'] ?? 0,
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

    /**
     * Convertir valor a int (0 o 1) de forma robusta
     * Maneja: boolean, string ('true', 'false', '1', '0', ''), int, null
     */
    private function convertToInt($value) {
        // Si ya es int, retornar 0 o 1
        if (is_int($value)) {
            return $value ? 1 : 0;
        }

        // Si es boolean, convertir directamente
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        // Si es string o cualquier otro tipo, usar filter_var
        // filter_var retorna true para: 'true', '1', 'on', 'yes'
        // filter_var retorna false para: 'false', '0', 'off', 'no', ''
        return (filter_var($value, FILTER_VALIDATE_BOOLEAN) || $value === 1 || $value === '1') ? 1 : 0;
    }
}
