<?php
/**
 * Modelo de Incidencias
 */

class Incident {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Crear incidencia
     */
    public function create($data) {
        $sql = "INSERT INTO incidents (
            reservation_id, guest_id, incident_type, title, description, status
        ) VALUES (?, ?, ?, ?, ?, 'pending')";

        $this->db->execute($sql, [
            $data['reservation_id'],
            $data['guest_id'] ?? null,
            $data['incident_type'],
            $data['title'] ?? null,
            $data['description']
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Obtener incidencias de una reserva
     */
    public function getByReservation($reservation_id) {
        $sql = "SELECT i.*, g.first_name, g.last_name
                FROM incidents i
                LEFT JOIN guests g ON i.guest_id = g.id
                WHERE i.reservation_id = ?
                ORDER BY i.created_at DESC";

        return $this->db->query($sql, [$reservation_id]);
    }

    /**
     * Actualizar estado de incidencia
     */
    public function updateStatus($id, $status, $response = null) {
        $sql = "UPDATE incidents
                SET status = ?, response = ?, resolved_at = NOW()
                WHERE id = ?";

        return $this->db->execute($sql, [$status, $response, $id]);
    }
}
