<?php
/**
 * Modelo de Checkin
 * Gestiona la relación entre reservas y viajeros
 */

class Checkin {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Crear nueva entrada de checkin
     */
    public function create($reserva_id, $viajero_id) {
        // Obtener el siguiente orden para esta reserva
        $orden = $this->getNextOrden($reserva_id);

        $sql = "INSERT INTO checkin (reserva_id, viajero_id, orden)
                VALUES (?, ?, ?)";

        try {
            $this->db->execute($sql, [$reserva_id, $viajero_id, $orden]);
            return $this->db->lastInsertId();
        } catch (Exception $e) {
            throw new Exception("Error al registrar checkin: " . $e->getMessage());
        }
    }

    /**
     * Obtener el siguiente número de orden para una reserva
     */
    private function getNextOrden($reserva_id) {
        $sql = "SELECT COALESCE(MAX(orden), 0) + 1 as next_orden
                FROM checkin
                WHERE reserva_id = ?";

        $result = $this->db->queryOne($sql, [$reserva_id]);
        return $result['next_orden'] ?? 1;
    }

    /**
     * Obtener todos los checkins de una reserva
     */
    public function getByReservation($reserva_id) {
        $sql = "SELECT c.*, v.*
                FROM checkin c
                INNER JOIN viajeros v ON c.viajero_id = v.id
                WHERE c.reserva_id = ?
                ORDER BY c.orden ASC";

        return $this->db->query($sql, [$reserva_id]);
    }

    /**
     * Obtener un checkin específico
     */
    public function getById($id) {
        $sql = "SELECT * FROM checkin WHERE id = ?";
        return $this->db->queryOne($sql, [$id]);
    }

    /**
     * Verificar si un viajero ya está en checkin de una reserva
     */
    public function exists($reserva_id, $viajero_id) {
        $sql = "SELECT COUNT(*) as total
                FROM checkin
                WHERE reserva_id = ? AND viajero_id = ?";

        $result = $this->db->queryOne($sql, [$reserva_id, $viajero_id]);
        return ($result['total'] ?? 0) > 0;
    }

    /**
     * Eliminar checkin
     */
    public function delete($id) {
        $sql = "DELETE FROM checkin WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }

    /**
     * Contar viajeros en checkin de una reserva
     */
    public function countByReservation($reserva_id) {
        $sql = "SELECT COUNT(*) as total
                FROM checkin
                WHERE reserva_id = ?";

        $result = $this->db->queryOne($sql, [$reserva_id]);
        return $result['total'] ?? 0;
    }

    /**
     * Actualizar orden de un checkin
     */
    public function updateOrden($id, $new_orden) {
        $sql = "UPDATE checkin SET orden = ? WHERE id = ?";
        return $this->db->execute($sql, [$new_orden, $id]);
    }
}
