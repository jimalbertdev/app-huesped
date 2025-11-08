<?php
/**
 * Modelo de Huéspedes
 */

class Guest {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Crear nuevo huésped
     */
    public function create($data) {
        $sql = "INSERT INTO guests (
            reservation_id, document_type, document_number, nationality,
            first_name, last_name, birth_date, sex,
            phone, email, is_responsible, registration_method,
            document_image_path, accepted_terms, accepted_terms_date,
            ip_address, user_agent, registration_completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

        try {
            $this->db->execute($sql, [
                $data['reservation_id'],
                $data['document_type'],
                $data['document_number'],
                $data['nationality'],
                $data['first_name'],
                $data['last_name'],
                $data['birth_date'],
                $data['sex'],
                $data['phone'] ?? null,
                $data['email'] ?? null,
                $data['is_responsible'] ?? false,
                $data['registration_method'] ?? 'manual',
                $data['document_image_path'] ?? null,
                $data['accepted_terms'] ?? true,
                $data['accepted_terms'] ? date('Y-m-d H:i:s') : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            return $this->db->lastInsertId();
        } catch (Exception $e) {
            // Verificar si es error de duplicado
            if (strpos($e->getMessage(), 'unique_guest_reservation') !== false) {
                throw new Exception("Este documento ya está registrado en esta reserva");
            }
            throw $e;
        }
    }

    /**
     * Obtener huéspedes de una reserva
     */
    public function getByReservation($reservation_id) {
        $sql = "SELECT * FROM guests WHERE reservation_id = ? ORDER BY is_responsible DESC, created_at ASC";
        return $this->db->query($sql, [$reservation_id]);
    }

    /**
     * Obtener huésped por ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM v_guests_with_reservation WHERE id = ?";
        return $this->db->queryOne($sql, [$id]);
    }

    /**
     * Actualizar huésped
     */
    public function update($id, $data) {
        $fields = [];
        $values = [];

        $allowed_fields = [
            'document_type', 'document_number', 'nationality',
            'first_name', 'last_name', 'birth_date', 'sex',
            'phone', 'email'
        ];

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return true;
        }

        $values[] = $id;
        $sql = "UPDATE guests SET " . implode(', ', $fields) . " WHERE id = ?";

        return $this->db->execute($sql, $values);
    }

    /**
     * Contar huéspedes registrados de una reserva
     */
    public function countRegistered($reservation_id) {
        $sql = "SELECT COUNT(*) as total FROM guests WHERE reservation_id = ? AND is_registered = 1";
        $result = $this->db->queryOne($sql, [$reservation_id]);
        return $result['total'] ?? 0;
    }

    /**
     * Obtener huésped responsable de una reserva
     */
    public function getResponsible($reservation_id) {
        $sql = "SELECT * FROM guests WHERE reservation_id = ? AND is_responsible = 1 LIMIT 1";
        return $this->db->queryOne($sql, [$reservation_id]);
    }
}
