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
        // Calcular edad automáticamente desde birth_date
        $age = null;
        if (isset($data['birth_date'])) {
            $birthDate = new DateTime($data['birth_date']);
            $today = new DateTime();
            $age = $today->diff($birthDate)->y;
        }

        // Normalizar document_type a mayúsculas
        $data['document_type'] = strtoupper($data['document_type']);

        $sql = "INSERT INTO guests (
            reservation_id, document_type, document_number, nationality,
            first_name, last_name, second_last_name, birth_date, age, sex,
            support_number, issue_date, expiry_date, relationship,
            phone_country_code, phone, email,
            residence_country, residence_municipality_code, residence_municipality_name,
            residence_postal_code, residence_address,
            is_responsible, registration_method, document_image_path,
            accepted_terms, accepted_terms_date, signature_path, contract_path,
            ip_address, user_agent, registration_completed_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        )";

        try {
            $this->db->execute($sql, [
                $data['reservation_id'],
                $data['document_type'],
                strtoupper(trim($data['document_number'])),
                $data['nationality'],
                trim($data['first_name']),
                trim($data['last_name']),
                isset($data['second_last_name']) ? trim($data['second_last_name']) : null,
                $data['birth_date'],
                $age,
                $data['sex'],
                isset($data['support_number']) ? strtoupper(trim($data['support_number'])) : null,
                $data['issue_date'] ?? null,
                $data['expiry_date'] ?? null,
                $data['relationship'] ?? null,
                $data['phone_country_code'] ?? null,
                $data['phone'] ?? null,
                isset($data['email']) ? strtolower(trim($data['email'])) : null,
                $data['residence_country'] ?? null,
                $data['residence_municipality_code'] ?? null,
                $data['residence_municipality_name'] ?? null,
                $data['residence_postal_code'] ?? null,
                $data['residence_address'] ?? null,
                $data['is_responsible'] ?? false,
                $data['registration_method'] ?? 'manual',
                $data['document_image_path'] ?? null,
                $data['accepted_terms'] ?? true,
                isset($data['accepted_terms']) && $data['accepted_terms'] ? date('Y-m-d H:i:s') : null,
                $data['signature_path'] ?? null,
                $data['contract_path'] ?? null,
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

        // Recalcular edad si se actualiza birth_date
        if (isset($data['birth_date'])) {
            $birthDate = new DateTime($data['birth_date']);
            $today = new DateTime();
            $data['age'] = $today->diff($birthDate)->y;
        }

        $allowed_fields = [
            'document_type', 'document_number', 'nationality',
            'first_name', 'last_name', 'second_last_name', 'birth_date', 'age', 'sex',
            'support_number', 'issue_date', 'expiry_date', 'relationship',
            'phone_country_code', 'phone', 'email',
            'residence_country', 'residence_municipality_code', 'residence_municipality_name',
            'residence_postal_code', 'residence_address',
            'signature_path', 'contract_path'
        ];

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";

                // Aplicar transformaciones según campo
                if (in_array($field, ['document_type', 'document_number', 'support_number'])) {
                    $values[] = strtoupper(trim($data[$field]));
                } elseif (in_array($field, ['first_name', 'last_name', 'second_last_name'])) {
                    $values[] = trim($data[$field]);
                } elseif ($field === 'email') {
                    $values[] = strtolower(trim($data[$field]));
                } else {
                    $values[] = $data[$field];
                }
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
