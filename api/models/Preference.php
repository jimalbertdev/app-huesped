<?php
/**
 * Modelo de Preferencias
 * NOTA: Ahora usa tabla 'reservas_detalles' con camas en formato JSON
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
        $sql = "INSERT INTO reservas_detalles (
            reseva_id, hora_llegada, camas, cuna, informacion_anfitrion
        ) VALUES (?, ?, ?, ?, ?)";

        // Construir JSON de camas
        $camasJson = $this->buildBedsJson($data);

        // Convertir cuna a "si"/"no"
        $cuna = $this->convertToYesNo($data['needs_crib'] ?? false);

        // Combinar información adicional
        $infoAnfitrion = $this->buildAdditionalInfo($data);

        return $this->db->execute($sql, [
            $reservation_id,
            $data['estimated_arrival_time'] ?? null,
            $camasJson,
            $cuna,
            $infoAnfitrion
        ]);
    }

    /**
     * Actualizar preferencias
     */
    private function update($reservation_id, $data) {
        $sql = "UPDATE reservas_detalles SET
            hora_llegada = ?,
            camas = ?,
            cuna = ?,
            informacion_anfitrion = ?
            WHERE reseva_id = ?";

        // Construir JSON de camas
        $camasJson = $this->buildBedsJson($data);

        // Convertir cuna a "si"/"no"
        $cuna = $this->convertToYesNo($data['needs_crib'] ?? false);

        // Combinar información adicional
        $infoAnfitrion = $this->buildAdditionalInfo($data);

        return $this->db->execute($sql, [
            $data['estimated_arrival_time'] ?? null,
            $camasJson,
            $cuna,
            $infoAnfitrion,
            $reservation_id
        ]);
    }

    /**
     * Obtener preferencias de una reserva
     */
    public function getByReservation($reservation_id) {
        $sql = "SELECT * FROM reservas_detalles WHERE reseva_id = ?";
        $result = $this->db->queryOne($sql, [$reservation_id]);

        if (!$result) {
            return false;
        }

        // Parsear y transformar datos al formato esperado por el frontend
        return $this->transformToFrontendFormat($result);
    }

    /**
     * Construir JSON de camas desde los datos del frontend
     */
    private function buildBedsJson($data) {
        $beds = [
            'camas_dobles' => (string)($data['double_beds'] ?? 0),
            'camas_individuales' => (string)($data['single_beds'] ?? 0),
            'sofa_cama' => (string)($data['sofa_beds'] ?? 0),
            'literas' => (string)($data['bunk_beds'] ?? 0)
        ];

        return json_encode($beds);
    }

    /**
     * Combinar información adicional en un solo campo
     */
    private function buildAdditionalInfo($data) {
        $parts = [];

        if (!empty($data['additional_info'])) {
            $parts[] = "Información adicional: " . $data['additional_info'];
        }

        if (!empty($data['allergies'])) {
            $parts[] = "Alergias: " . $data['allergies'];
        }

        if (!empty($data['special_requests'])) {
            $parts[] = "Peticiones especiales: " . $data['special_requests'];
        }

        return !empty($parts) ? implode("\n\n", $parts) : null;
    }

    /**
     * Transformar datos de BD al formato esperado por el frontend
     */
    private function transformToFrontendFormat($dbData) {
        // Decodificar JSON de camas
        $camas = json_decode($dbData['camas'] ?? '{}', true);

        return [
            'id' => $dbData['id'],
            'reservation_id' => $dbData['reseva_id'],
            'needs_crib' => $dbData['cuna'] === 'si' || $dbData['cuna'] === '1',
            'double_beds' => (int)($camas['camas_dobles'] ?? 0),
            'single_beds' => (int)($camas['camas_individuales'] ?? 0),
            'sofa_beds' => (int)($camas['sofa_cama'] ?? 0),
            'bunk_beds' => (int)($camas['literas'] ?? 0),
            'estimated_arrival_time' => $dbData['hora_llegada'],
            'additional_info' => $dbData['informacion_anfitrion'],
            // Mantener compatibilidad con campos antiguos
            'allergies' => null,
            'special_requests' => null,
            'created_at' => null,
            'updated_at' => null
        ];
    }

    /**
     * Convertir valor a "si"/"no"
     */
    private function convertToYesNo($value) {
        // Si es boolean
        if (is_bool($value)) {
            return $value ? 'si' : 'no';
        }

        // Si es int
        if (is_int($value)) {
            return $value ? 'si' : 'no';
        }

        // Si es string
        if (in_array(strtolower($value), ['true', '1', 'si', 'yes', 'on'])) {
            return 'si';
        }

        return 'no';
    }
}
