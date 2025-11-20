<?php
/**
 * Modelo: BedAvailability
 * Gestiona la disponibilidad de camas por alojamiento
 */

class BedAvailability {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Obtener disponibilidad de camas por ID de alojamiento
     */
    public function getByAccommodation($accommodation_id) {
        $sql = "SELECT
                    id_alojamiento as accommodation_id,
                    camas_dobles as double_beds,
                    camas_individuales as single_beds,
                    sofa_cama as sofa_beds,
                    literas as bunk_beds,
                    cuna as crib
                FROM camas_alojamiento
                WHERE id_alojamiento = ?";

        $result = $this->db->queryOne($sql, [$accommodation_id]);

        if (!$result) {
            return null;
        }

        // Convertir a enteros y booleano
        return [
            'accommodation_id' => (int)$result['accommodation_id'],
            'double_beds' => (int)($result['double_beds'] ?? 0),
            'single_beds' => (int)($result['single_beds'] ?? 0),
            'sofa_beds' => (int)($result['sofa_beds'] ?? 0),
            'bunk_beds' => (int)($result['bunk_beds'] ?? 0),
            'crib' => (bool)($result['crib'] ?? false),
        ];
    }

    /**
     * Verificar si el alojamiento tiene disponibilidad de un tipo de cama
     */
    public function hasAvailability($accommodation_id, $bed_type) {
        $availability = $this->getByAccommodation($accommodation_id);

        if (!$availability) {
            return false;
        }

        $field_map = [
            'double' => 'double_beds',
            'single' => 'single_beds',
            'sofa' => 'sofa_beds',
            'bunk' => 'bunk_beds',
            'crib' => 'crib'
        ];

        $field = $field_map[$bed_type] ?? null;

        if (!$field) {
            return false;
        }

        return $availability[$field] > 0 || $availability[$field] === true;
    }

    /**
     * Validar que la solicitud de camas no exceda la disponibilidad
     */
    public function validateRequest($accommodation_id, $requested) {
        $availability = $this->getByAccommodation($accommodation_id);

        if (!$availability) {
            return [
                'valid' => false,
                'errors' => ['No se encontró información de camas para este alojamiento']
            ];
        }

        $errors = [];

        // Validar cada tipo de cama
        if (isset($requested['double_beds']) && $requested['double_beds'] > 0) {
            if ($availability['double_beds'] <= 0) {
                $errors[] = "Este alojamiento no tiene camas dobles disponibles";
            } elseif ($requested['double_beds'] > $availability['double_beds']) {
                $errors[] = "Solo hay {$availability['double_beds']} cama(s) doble(s) disponible(s)";
            }
        }

        if (isset($requested['single_beds']) && $requested['single_beds'] > 0) {
            if ($availability['single_beds'] <= 0) {
                $errors[] = "Este alojamiento no tiene camas individuales disponibles";
            } elseif ($requested['single_beds'] > $availability['single_beds']) {
                $errors[] = "Solo hay {$availability['single_beds']} cama(s) individual(es) disponible(s)";
            }
        }

        if (isset($requested['sofa_beds']) && $requested['sofa_beds'] > 0) {
            if ($availability['sofa_beds'] <= 0) {
                $errors[] = "Este alojamiento no tiene sofás cama disponibles";
            } elseif ($requested['sofa_beds'] > $availability['sofa_beds']) {
                $errors[] = "Solo hay {$availability['sofa_beds']} sofá(s) cama disponible(s)";
            }
        }

        if (isset($requested['bunk_beds']) && $requested['bunk_beds'] > 0) {
            if ($availability['bunk_beds'] <= 0) {
                $errors[] = "Este alojamiento no tiene literas disponibles";
            } elseif ($requested['bunk_beds'] > $availability['bunk_beds']) {
                $errors[] = "Solo hay {$availability['bunk_beds']} litera(s) disponible(s)";
            }
        }

        if (isset($requested['needs_crib']) && $requested['needs_crib']) {
            if (!$availability['crib']) {
                $errors[] = "Este alojamiento no tiene cuna disponible";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'availability' => $availability
        ];
    }
}
