<?php
/**
 * Modelo para gestionar términos y condiciones
 * Obtiene términos desde caracteristica_alojamiento.terminos_condiciones_app_huesped
 */

class Terms {
    private $db;
    private $conn;

    public function __construct($database) {
        $this->db = $database;
        $this->conn = $this->db->getConnection();
    }

    /**
     * Obtener términos y condiciones por alojamiento e idioma
     * 
     * @param int $accommodationId ID del alojamiento
     * @param string $language Código de idioma (es, en, ca, fr, de, nl)
     * @return array|null Términos en el idioma solicitado o null si no existen
     */
    public function getByAccommodation($accommodationId, $language = 'es') {
        try {
            // Normalizar código de idioma
            $language = strtolower($language);
            
            // Mapeo de idiomas a campos en la base de datos
            // Asumiendo estructura: terminos_condiciones_app_huesped_{idioma}
            $languageFields = [
                'es' => 'terminos_condiciones_app_huesped',
                'en' => 'terminos_condiciones_app_huesped_en',
                'ca' => 'terminos_condiciones_app_huesped_ca',
                'fr' => 'terminos_condiciones_app_huesped_fr',
                'de' => 'terminos_condiciones_app_huesped_de',
                'nl' => 'terminos_condiciones_app_huesped_nl',
            ];

            // Si el idioma no está soportado, usar español por defecto
            $fieldName = $languageFields[$language] ?? $languageFields['es'];
            $actualLanguage = isset($languageFields[$language]) ? $language : 'es';

            // Consultar términos
            $query = "
                SELECT 
                    ac.idalojamiento,
                    ac.{$fieldName} as terms_html,
                    a.nombre as accommodation_name
                FROM alojamiento_caracteristica ac
                INNER JOIN alojamiento a ON ac.idalojamiento = a.idalojamiento
                WHERE ac.idalojamiento = :accommodation_id
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':accommodation_id', $accommodationId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$result) {
                return null;
            }

            // Si el campo de términos está vacío, intentar con español como fallback
            if (empty($result['terms_html']) && $actualLanguage !== 'es') {
                $query = "
                    SELECT 
                        ac.idalojamiento,
                        ac.terminos_condiciones_app_huesped as terms_html,
                        a.nombre as accommodation_name
                    FROM alojamiento_caracteristica ac
                    INNER JOIN alojamiento a ON ac.idalojamiento = a.idalojamiento
                    WHERE ac.idalojamiento = :accommodation_id
                ";

                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':accommodation_id', $accommodationId, PDO::PARAM_INT);
                $stmt->execute();

                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $actualLanguage = 'es';
            }

            // Sanitizar HTML
            $sanitizedHtml = $this->sanitizeHtml($result['terms_html'] ?? '');

            return [
                'accommodation_id' => (int)$result['idalojamiento'],
                'accommodation_name' => $result['accommodation_name'],
                'language' => $actualLanguage,
                'terms_html' => $sanitizedHtml,
                'available_languages' => $this->getAvailableLanguages($accommodationId)
            ];

        } catch (PDOException $e) {
            error_log("Error en Terms::getByAccommodation: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Obtener idiomas disponibles para un alojamiento
     * 
     * @param int $accommodationId ID del alojamiento
     * @return array Lista de códigos de idioma disponibles
     */
    public function getAvailableLanguages($accommodationId) {
        try {
            $query = "
                SELECT 
                    terminos_condiciones_app_huesped,
                    terminos_condiciones_app_huesped_en,
                    terminos_condiciones_app_huesped_ca,
                    terminos_condiciones_app_huesped_fr,
                    terminos_condiciones_app_huesped_de,
                    terminos_condiciones_app_huesped_nl
                FROM alojamiento_caracteristica
                WHERE idalojamiento = :accommodation_id
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':accommodation_id', $accommodationId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$result) {
                return ['es']; // Por defecto español
            }

            $available = [];
            
            // Verificar qué campos tienen contenido
            if (!empty($result['terminos_condiciones_app_huesped'])) {
                $available[] = 'es';
            }
            if (!empty($result['terminos_condiciones_app_huesped_en'])) {
                $available[] = 'en';
            }
            if (!empty($result['terminos_condiciones_app_huesped_ca'])) {
                $available[] = 'ca';
            }
            if (!empty($result['terminos_condiciones_app_huesped_fr'])) {
                $available[] = 'fr';
            }
            if (!empty($result['terminos_condiciones_app_huesped_de'])) {
                $available[] = 'de';
            }
            if (!empty($result['terminos_condiciones_app_huesped_nl'])) {
                $available[] = 'nl';
            }

            // Si no hay ningún idioma disponible, devolver español por defecto
            return empty($available) ? ['es'] : $available;

        } catch (PDOException $e) {
            error_log("Error en Terms::getAvailableLanguages: " . $e->getMessage());
            return ['es'];
        }
    }

    /**
     * Sanitizar HTML para prevenir XSS
     * Permite solo tags seguros para términos y condiciones
     * 
     * @param string $html HTML a sanitizar
     * @return string HTML sanitizado
     */
    private function sanitizeHtml($html) {
        if (empty($html)) {
            return '';
        }

        // Lista de tags permitidos para términos y condiciones
        $allowedTags = '<div><p><h1><h2><h3><h4><h5><h6><ul><ol><li><strong><em><b><i><br><span><a>';

        // Sanitizar HTML manteniendo solo tags permitidos
        $sanitized = strip_tags($html, $allowedTags);

        // Limpiar atributos peligrosos de los enlaces
        $sanitized = preg_replace('/<a\s+([^>]*?)href\s*=\s*["\']javascript:[^"\']*["\']([^>]*?)>/i', '<a $1 $2>', $sanitized);
        $sanitized = preg_replace('/<a\s+([^>]*?)on\w+\s*=\s*["\'][^"\']*["\']([^>]*?)>/i', '<a $1 $2>', $sanitized);

        return $sanitized;
    }

    /**
     * Verificar si un alojamiento tiene términos configurados
     * 
     * @param int $accommodationId ID del alojamiento
     * @return bool True si tiene términos, false si no
     */
    public function hasTerms($accommodationId) {
        try {
            $query = "
                SELECT COUNT(*) as count
                FROM alojamiento_caracteristica
                WHERE idalojamiento = :accommodation_id
                AND (
                    terminos_condiciones_app_huesped IS NOT NULL 
                    AND terminos_condiciones_app_huesped != ''
                )
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':accommodation_id', $accommodationId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result['count'] > 0;

        } catch (PDOException $e) {
            error_log("Error en Terms::hasTerms: " . $e->getMessage());
            return false;
        }
    }
}
