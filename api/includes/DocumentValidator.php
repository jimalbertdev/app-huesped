<?php
/**
 * Validador de documentos españoles (DNI y NIE)
 * Basado en normativa oficial de la Policía Nacional de España
 */

class DocumentValidator {

    /**
     * Tabla oficial de letras del DNI español
     */
    private const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

    /**
     * Equivalencias para NIE: X=0, Y=1, Z=2
     */
    private const EQUIVALENCIAS_NIE = [
        'X' => '0',
        'Y' => '1',
        'Z' => '2'
    ];

    /**
     * Calcula la letra de control del DNI español
     */
    private static function calcularLetraDni($numero) {
        $posicion = intval($numero) % 23;
        return self::LETRAS_DNI[$posicion];
    }

    /**
     * Calcula la letra de control del NIE español
     */
    private static function calcularLetraNie($primeraLetra, $numero) {
        $numeroCompleto = self::EQUIVALENCIAS_NIE[$primeraLetra] . $numero;
        $posicion = intval($numeroCompleto) % 23;
        return self::LETRAS_DNI[$posicion];
    }

    /**
     * Validación específica para DNI español
     * Formato: 8 dígitos + 1 letra (ejemplo: 12345678Z)
     *
     * @param string $dni El DNI a validar
     * @return array ['valid' => bool, 'error' => string|null]
     */
    public static function validateDNI($dni) {
        $dniClean = strtoupper(trim($dni));

        // 1. Validar formato básico: 8 dígitos + 1 letra
        if (!preg_match('/^[0-9]{8}[A-Z]$/', $dniClean)) {
            return [
                'valid' => false,
                'error' => 'El DNI debe tener exactamente 8 dígitos seguidos de una letra (ejemplo: 12345678Z)'
            ];
        }

        $numero = substr($dniClean, 0, 8);
        $letra = substr($dniClean, 8, 1);

        // 2. Validar que no sea un número inválido
        if ($numero === '00000000') {
            return [
                'valid' => false,
                'error' => 'El número del DNI no puede ser 00000000'
            ];
        }

        // 3. Validar que el número esté en el rango válido
        $numeroInt = intval($numero);
        if ($numeroInt < 1 || $numeroInt > 99999999) {
            return [
                'valid' => false,
                'error' => 'El número del DNI debe estar entre 00000001 y 99999999'
            ];
        }

        // 4. Calcular y validar letra de control
        $letraCorrecta = self::calcularLetraDni($numero);

        if ($letra !== $letraCorrecta) {
            return [
                'valid' => false,
                'error' => "La letra del DNI es incorrecta. Para el número {$numero}, la letra correcta es {$letraCorrecta}"
            ];
        }

        return ['valid' => true, 'error' => null];
    }

    /**
     * Validación específica para NIE español
     * Formato: X/Y/Z + 7 dígitos + 1 letra (ejemplo: X1234567L)
     *
     * @param string $nie El NIE a validar
     * @return array ['valid' => bool, 'error' => string|null]
     */
    public static function validateNIE($nie) {
        $nieClean = strtoupper(trim($nie));

        // 1. Validar formato básico: X/Y/Z + 7 dígitos + 1 letra
        if (!preg_match('/^[XYZ][0-9]{7}[A-Z]$/', $nieClean)) {
            return [
                'valid' => false,
                'error' => 'El NIE debe empezar por X, Y o Z, seguido de 7 dígitos y una letra (ejemplo: X1234567L)'
            ];
        }

        $primeraLetra = substr($nieClean, 0, 1);
        $numero = substr($nieClean, 1, 7);
        $letra = substr($nieClean, 8, 1);

        // 2. Validar que no sea un número inválido
        if ($numero === '0000000') {
            return [
                'valid' => false,
                'error' => 'El número del NIE no puede ser 0000000'
            ];
        }

        // 3. Validar rango del número
        $numeroInt = intval($numero);
        if ($numeroInt < 1 || $numeroInt > 9999999) {
            return [
                'valid' => false,
                'error' => 'El número del NIE debe estar entre 0000001 y 9999999'
            ];
        }

        // 4. Calcular y validar letra de control
        $letraCorrecta = self::calcularLetraNie($primeraLetra, $numero);

        if ($letra !== $letraCorrecta) {
            return [
                'valid' => false,
                'error' => "La letra del NIE es incorrecta. Para {$primeraLetra}{$numero}, la letra correcta es {$letraCorrecta}"
            ];
        }

        return ['valid' => true, 'error' => null];
    }

    /**
     * Validación genérica de documento según tipo
     *
     * @param string $documentType Tipo de documento (DNI, NIE, etc.)
     * @param string $documentNumber Número del documento
     * @return array ['valid' => bool, 'error' => string|null]
     */
    public static function validateDocument($documentType, $documentNumber) {
        $type = strtoupper(trim($documentType));

        switch ($type) {
            case 'DNI':
                return self::validateDNI($documentNumber);

            case 'NIE':
                return self::validateNIE($documentNumber);

            default:
                // Para otros tipos de documento, solo validar que no esté vacío
                if (empty(trim($documentNumber))) {
                    return [
                        'valid' => false,
                        'error' => 'El número de documento es obligatorio'
                    ];
                }
                return ['valid' => true, 'error' => null];
        }
    }

    /**
     * Formatea un DNI agregando la letra de control si solo tiene números
     *
     * @param string $numero El número del DNI
     * @return string|null El DNI formateado o null si el formato es inválido
     */
    public static function formatDNI($numero) {
        $numeroClean = trim($numero);

        // Si ya tiene letra, devolverlo en mayúsculas
        if (preg_match('/^[0-9]{8}[A-Z]$/i', $numeroClean)) {
            return strtoupper($numeroClean);
        }

        // Si solo tiene 8 dígitos, calcular y agregar letra
        if (preg_match('/^[0-9]{8}$/', $numeroClean)) {
            $letra = self::calcularLetraDni($numeroClean);
            return $numeroClean . $letra;
        }

        return null;
    }

    /**
     * Formatea un NIE agregando la letra de control si solo tiene el prefijo y números
     *
     * @param string $numero El número del NIE
     * @return string|null El NIE formateado o null si el formato es inválido
     */
    public static function formatNIE($numero) {
        $numeroClean = strtoupper(trim($numero));

        // Si ya tiene el formato completo, devolverlo
        if (preg_match('/^[XYZ][0-9]{7}[A-Z]$/', $numeroClean)) {
            return $numeroClean;
        }

        // Si solo tiene prefijo + 7 dígitos, calcular y agregar letra
        if (preg_match('/^[XYZ][0-9]{7}$/', $numeroClean)) {
            $primeraLetra = substr($numeroClean, 0, 1);
            $numero = substr($numeroClean, 1, 7);
            $letra = self::calcularLetraNie($primeraLetra, $numero);
            return $numeroClean . $letra;
        }

        return null;
    }
}
