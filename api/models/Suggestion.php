<?php
/**
 * Modelo de Sugerencias y Quejas
 * Maneja las sugerencias y quejas de los huéspedes
 */

class Suggestion {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Crear nueva sugerencia o queja
     */
    public function create($data) {
        $sql = "INSERT INTO reservas_sugerencias
                (id_reserva, id_cliente, asunto, sugerencias, tipo, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())";

        $params = [
            $data['reservation_id'],
            $data['guest_id'] ?? null,
            $data['subject'],
            $data['description'],
            $data['type'] // 'Queja' o 'Sugerencia'
        ];

        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Obtener todas las sugerencias de una reserva
     */
    public function getByReservation($reservation_id) {
        $sql = "SELECT
                    s.id,
                    s.id_reserva as reservation_id,
                    s.id_cliente as guest_id,
                    s.asunto as subject,
                    s.sugerencias as description,
                    s.tipo as type,
                    s.created_at,
                    v.n0mbr3s as guest_name,
                    v.p3ll1d01 as guest_lastname
                FROM reservas_sugerencias s
                LEFT JOIN viajeros v ON s.id_cliente = v.id
                WHERE s.id_reserva = ?
                ORDER BY s.created_at DESC";

        return $this->db->query($sql, [$reservation_id]);
    }

    /**
     * Obtener una sugerencia por ID
     */
    public function getById($id) {
        $sql = "SELECT
                    s.id,
                    s.id_reserva as reservation_id,
                    s.id_cliente as guest_id,
                    s.asunto as subject,
                    s.sugerencias as description,
                    s.tipo as type,
                    s.created_at,
                    v.n0mbr3s as guest_name,
                    v.p3ll1d01 as guest_lastname
                FROM reservas_sugerencias s
                LEFT JOIN viajeros v ON s.id_cliente = v.id
                WHERE s.id = ?";

        return $this->db->queryOne($sql, [$id]);
    }

    /**
     * Contar sugerencias por tipo
     */
    public function countByType($reservation_id, $type) {
        $sql = "SELECT COUNT(*) as count
                FROM reservas_sugerencias
                WHERE id_reserva = ? AND tipo = ?";

        $result = $this->db->queryOne($sql, [$reservation_id, $type]);
        return $result ? (int)$result['count'] : 0;
    }

    /**
     * Obtener estadísticas de una reserva
     */
    public function getStats($reservation_id) {
        return [
            'total' => $this->countByType($reservation_id, 'Queja') + $this->countByType($reservation_id, 'Sugerencia'),
            'complaints' => $this->countByType($reservation_id, 'Queja'),
            'suggestions' => $this->countByType($reservation_id, 'Sugerencia')
        ];
    }
}
