<?php
/**
 * Modelo: Cliente
 * Gestiona datos de clientes/titulares de reservas desde tabla clientem
 */

class Cliente {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Obtener cliente por ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM clientem WHERE id = ?";
        $result = $this->db->queryOne($sql, [$id]);

        if (!$result) {
            return null;
        }

        return $this->formatForFrontend($result);
    }

    /**
     * Formatear datos de cliente para el frontend
     * Mapea campos de clientem a estructura esperada por formulario
     */
    private function formatForFrontend($cliente) {
        // Split apellidos en dos partes
        $apellidos = explode(' ', trim($cliente['apellidos'] ?? ''), 2);

        // Mapear tipo de documento
        $documentType = $this->mapDocumentType($cliente['identificador_id']);

        // Formatear prefijo telefónico
        $phonePrefix = $cliente['prefijo'] ?? '34';
        if (strpos($phonePrefix, '+') !== 0) {
            $phonePrefix = '+' . $phonePrefix;
        }

        return [
            'id' => (int)$cliente['id'],
            'document_type' => $documentType,
            'document_number' => $cliente['identificador'] ?? '',
            'first_name' => $cliente['nombres'] ?? '',
            'last_name' => $apellidos[0] ?? '',
            'second_last_name' => $apellidos[1] ?? '',
            'nationality' => $this->normalizeCountryCode($cliente['codpais']),
            'residence_country' => $this->normalizeCountryCode($cliente['codpais']),
            'residence_municipality_code' => $cliente['idciudad'] ?? null,
            'residence_postal_code' => $cliente['codigo_postal'] ?? '',
            'residence_address' => $cliente['direccion'] ?? '',
            'phone_country_code' => $phonePrefix,
            'phone' => $cliente['telefono_movil'] ?? $cliente['telefono_local'] ?? '',
            'email' => $cliente['email'] ?? '',
        ];
    }

    /**
     * Mapear tipo de documento de clientem a tipos de la aplicación
     */
    private function mapDocumentType($tipo) {
        if (empty($tipo)) return 'OTRO';

        $tipo = strtoupper(trim($tipo));

        $map = [
            'DNI' => 'DNI',
            'NIE' => 'NIE',
            'PASSPORT' => 'PAS',
            'PASAPORTE' => 'PAS',
            'PASS' => 'PAS',
            'NIF' => 'DNI', // NIF se trata como DNI
        ];

        return $map[$tipo] ?? 'OTRO';
    }

    /**
     * Normalizar código de país
     */
    private function normalizeCountryCode($code) {
        if (empty($code)) return '';

        $code = strtoupper(trim($code));

        // Mapeo de códigos comunes
        $map = [
            'ESP' => 'ES',
            'ESPAÑA' => 'ES',
            'SPAIN' => 'ES',
        ];

        return $map[$code] ?? $code;
    }

    /**
     * Verificar si un cliente existe
     */
    public function exists($id) {
        $sql = "SELECT id FROM clientem WHERE id = ?";
        $result = $this->db->queryOne($sql, [$id]);
        return $result !== null;
    }
}
