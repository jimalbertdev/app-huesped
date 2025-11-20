<?php
/**
 * Modelo de Viajeros (nueva estructura)
 * Reemplaza la tabla guests con campos ofuscados
 */

class Viajero {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Calcular el tipo de viajero según edad
     */
    private function getTipoByAge($age) {
        if ($age < 12) return 'niño';
        if ($age < 18) return 'adolescente';
        return 'adulto';
    }

    /**
     * Calcular edad desde fecha de nacimiento
     */
    private function calculateAge($birthDate) {
        $birth = new DateTime($birthDate);
        $today = new DateTime();
        return $today->diff($birth)->y;
    }

    /**
     * Crear nuevo viajero
     */
    public function create($data) {
        // Calcular edad automáticamente
        $age = null;
        $tipo = null;
        if (isset($data['birth_date'])) {
            $age = $this->calculateAge($data['birth_date']);
            $tipo = $this->getTipoByAge($age);
        }

        // Normalizar document_type a mayúsculas
        $data['document_type'] = strtoupper($data['document_type']);

        // Determinar campo de municipio (unificado en esta tabla)
        $cod_municipio = null;
        if (isset($data['residence_country']) && $data['residence_country'] === 'ES') {
            $cod_municipio = $data['residence_municipality_code'] ?? null;
        } else {
            $cod_municipio = $data['residence_municipality_name'] ?? null;
        }

        $sql = "INSERT INTO viajeros (
            nvm3r0_d0cvm3nt0, n0mbr3s, p3ll1d01, p3ll1d02,
            f3ch4_n4c1m13nt0, sexo, tipo_documento, nvm3r0_t3l3f0n0,
            f3ch4_3xp3d1c10n, f3ch4_v3nc1m13nt0, m41l, edad, tipo,
            estatus, observacion, firma, responsable, nacionalidad,
            parentesco, d1r3cc10n, cod_municipio, c0d_p0st4l,
            d1r_p41s, n_soporte, registrado_raixer
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
        )";

        try {
            $this->db->execute($sql, [
                // Documento
                strtoupper(trim($data['document_number'])),

                // Nombres
                trim($data['first_name']),
                trim($data['last_name']),
                isset($data['second_last_name']) ? trim($data['second_last_name']) : null,

                // Fecha nacimiento y sexo
                $data['birth_date'],
                $data['sex'],

                // Tipo documento
                $data['document_type'],

                // Teléfono
                $data['phone'] ?? null,

                // Fechas del documento
                $data['issue_date'] ?? null,
                $data['expiry_date'] ?? null,

                // Email
                isset($data['email']) ? strtolower(trim($data['email'])) : null,

                // Edad y tipo (calculados)
                $age,
                $tipo,

                // Estatus y observación
                'Registrado', // estatus por defecto
                null, // observacion (para uso interno)

                // Firma y responsable
                $data['signature_path'] ?? null,
                $data['is_responsible'] ?? false,

                // Nacionalidad y parentesco
                $data['nationality'],
                $data['relationship'] ?? null,

                // Dirección
                $data['residence_address'] ?? null,
                $cod_municipio,
                $data['residence_postal_code'] ?? null,
                $data['residence_country'] ?? null,

                // Número de soporte
                isset($data['support_number']) ? strtoupper(trim($data['support_number'])) : null,

                // Flag de registro (actualizado por cronjob)
                0 // registrado_raixer = false (pendiente de procesamiento)
            ]);

            return $this->db->lastInsertId();
        } catch (Exception $e) {
            // Verificar si es error de duplicado
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                throw new Exception("Este documento ya está registrado");
            }
            throw $e;
        }
    }

    /**
     * Transformar datos ofuscados a formato frontend
     */
    private function formatForFrontend($viajero) {
        if (!$viajero) return null;

        // Determinar si cod_municipio es un código ESP o nombre de ciudad
        $municipio_code = null;
        $municipio_name = null;
        if (isset($viajero['cod_municipio'])) {
            // Si el país es ES, es un código, sino es un nombre
            if (isset($viajero['d1r_p41s']) && $viajero['d1r_p41s'] === 'ES') {
                $municipio_code = $viajero['cod_municipio'];
            } else {
                $municipio_name = $viajero['cod_municipio'];
            }
        }

        return [
            'id' => $viajero['id'],
            'phone' => $viajero['nvm3r0_t3l3f0n0'] ?? null,
            'first_name' => $viajero['n0mbr3s'] ?? null,
            'last_name' => $viajero['p3ll1d01'] ?? null,
            'second_last_name' => $viajero['p3ll1d02'] ?? null,
            'birth_date' => $viajero['f3ch4_n4c1m13nt0'] ?? null,
            'sex' => $viajero['sexo'] ?? null,
            'document_type' => $viajero['tipo_documento'] ?? null,
            'document_number' => $viajero['nvm3r0_d0cvm3nt0'] ?? null,
            'issue_date' => $viajero['f3ch4_3xp3d1c10n'] ?? null,
            'expiry_date' => $viajero['f3ch4_v3nc1m13nt0'] ?? null,
            'email' => $viajero['m41l'] ?? null,
            'age' => $viajero['edad'] ?? null,
            'tipo' => $viajero['tipo'] ?? null,
            'estatus' => $viajero['estatus'] ?? null,
            'observacion' => $viajero['observacion'] ?? null,
            'is_responsible' => isset($viajero['responsable']) ? (int)$viajero['responsable'] : 0,
            'signature_path' => $viajero['firma'] ?? null,
            'nationality' => $viajero['nacionalidad'] ?? null,
            'relationship' => $viajero['parentesco'] ?? null,
            'residence_country' => $viajero['d1r_p41s'] ?? null,
            'residence_municipality_code' => $municipio_code,
            'residence_municipality_name' => $municipio_name,
            'residence_postal_code' => $viajero['c0d_p0st4l'] ?? null,
            'residence_address' => $viajero['d1r3cc10n'] ?? null,
            'support_number' => $viajero['n_soporte'] ?? null,
            'is_registered' => isset($viajero['registrado_raixer']) ? (int)$viajero['registrado_raixer'] : 0,
        ];
    }

    /**
     * Obtener viajero por ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM viajeros WHERE id = ?";
        $viajero = $this->db->queryOne($sql, [$id]);
        return $this->formatForFrontend($viajero);
    }

    /**
     * Obtener viajeros de una reserva a través de checkin
     */
    public function getByReservation($reservation_id) {
        $sql = "SELECT v.*
                FROM viajeros v
                INNER JOIN checkin c ON c.viajero_id = v.id
                WHERE c.reserva_id = ?
                ORDER BY c.orden ASC";
        $viajeros = $this->db->query($sql, [$reservation_id]);

        // Formatear cada viajero
        return array_map(function($viajero) {
            return $this->formatForFrontend($viajero);
        }, $viajeros);
    }

    /**
     * Actualizar viajero
     */
    public function update($id, $data) {
        $fields = [];
        $values = [];

        // Recalcular edad y tipo si se actualiza birth_date
        if (isset($data['birth_date'])) {
            $data['age'] = $this->calculateAge($data['birth_date']);
            $data['tipo'] = $this->getTipoByAge($data['age']);
        }

        // Mapeo de campos frontend -> backend
        $fieldMapping = [
            'first_name' => 'n0mbr3s',
            'last_name' => 'p3ll1d01',
            'second_last_name' => 'p3ll1d02',
            'birth_date' => 'f3ch4_n4c1m13nt0',
            'sex' => 'sexo',
            'document_type' => 'tipo_documento',
            'document_number' => 'nvm3r0_d0cvm3nt0',
            'issue_date' => 'f3ch4_3xp3d1c10n',
            'expiry_date' => 'f3ch4_v3nc1m13nt0',
            'email' => 'm41l',
            'age' => 'edad',
            'tipo' => 'tipo',
            'nationality' => 'nacionalidad',
            'relationship' => 'parentesco',
            'phone_country_code' => 'country_code',
            'phone' => 'nvm3r0_t3l3f0n0',
            'residence_country' => 'd1r_p41s',
            'residence_postal_code' => 'c0d_p0st4l',
            'residence_address' => 'd1r3cc10n',
            'support_number' => 'n_soporte',
            'signature_path' => 'firma',
            'contract_path' => 'contract_path'
        ];

        foreach ($fieldMapping as $frontField => $dbField) {
            if (isset($data[$frontField])) {
                $fields[] = "$dbField = ?";

                // Aplicar transformaciones según campo
                if (in_array($frontField, ['document_type', 'document_number', 'support_number'])) {
                    $values[] = strtoupper(trim($data[$frontField]));
                } elseif (in_array($frontField, ['first_name', 'last_name', 'second_last_name'])) {
                    $values[] = trim($data[$frontField]);
                } elseif ($frontField === 'email') {
                    $values[] = strtolower(trim($data[$frontField]));
                } else {
                    $values[] = $data[$frontField];
                }
            }
        }

        // Campos especiales de municipio
        if (isset($data['residence_country']) && $data['residence_country'] === 'ES') {
            if (isset($data['residence_municipality_code'])) {
                $fields[] = "cod_municipio_esp = ?";
                $values[] = $data['residence_municipality_code'];
            }
        } else {
            if (isset($data['residence_municipality_name'])) {
                $fields[] = "cod_municipio_otro = ?";
                $values[] = $data['residence_municipality_name'];
            }
        }

        if (empty($fields)) {
            return true;
        }

        $values[] = $id;
        $sql = "UPDATE viajeros SET " . implode(', ', $fields) . " WHERE id = ?";

        return $this->db->execute($sql, $values);
    }

    /**
     * Obtener viajero responsable de una reserva
     */
    public function getResponsibleByReservation($reservation_id) {
        $sql = "SELECT v.*
                FROM viajeros v
                INNER JOIN checkin c ON c.viajero_id = v.id
                WHERE c.reserva_id = ? AND v.responsable = 1
                LIMIT 1";
        $viajero = $this->db->queryOne($sql, [$reservation_id]);
        return $this->formatForFrontend($viajero);
    }

    /**
     * Contar viajeros registrados de una reserva
     */
    public function countByReservation($reservation_id) {
        $sql = "SELECT COUNT(*) as total
                FROM viajeros v
                INNER JOIN checkin c ON c.viajero_id = v.id
                WHERE c.reserva_id = ? AND v.is_registered = 1";
        $result = $this->db->queryOne($sql, [$reservation_id]);
        return $result['total'] ?? 0;
    }
}
