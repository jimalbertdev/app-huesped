<?php
/**
 * Validador de números telefónicos usando libphonenumber
 */

use libphonenumber\PhoneNumberUtil;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\NumberParseException;

class PhoneValidator {
    private $phoneUtil;

    public function __construct() {
        $this->phoneUtil = PhoneNumberUtil::getInstance();
    }

    /**
     * Valida y formatea un número de teléfono
     *
     * @param string $phoneNumber Número de teléfono (puede incluir código de país)
     * @param string $countryCode Código de país ISO 2 letras (ej: ES, US, FR)
     * @return array ['valid' => bool, 'formatted' => string, 'error' => string]
     */
    public function validate($phoneNumber, $countryCode = null) {
        // Si no hay número, no validar
        if (empty($phoneNumber)) {
            return [
                'valid' => true,
                'formatted' => null,
                'error' => null
            ];
        }

        try {
            // Intentar parsear el número
            // Si tiene +, lo parseamos sin país de referencia
            // Si no tiene +, usamos el país proporcionado
            if (strpos($phoneNumber, '+') === 0) {
                $parsedNumber = $this->phoneUtil->parse($phoneNumber, null);
                
                // NUEVA VALIDACIÓN: Verificar que el código del número coincida con el seleccionado
                if (!empty($countryCode)) {
                    $expectedRegion = strtoupper($countryCode);
                    $actualRegion = $this->phoneUtil->getRegionCodeForNumber($parsedNumber);
                    
                    if ($actualRegion !== $expectedRegion) {
                        $expectedCountryName = $this->getCountryNameByISO($expectedRegion);
                        $actualCountryName = $this->getCountryNameByISO($actualRegion);
                        
                        return [
                            'valid' => false,
                            'formatted' => null,
                            'error' => "El número pertenece a {$actualCountryName}, pero seleccionaste {$expectedCountryName}. Por favor, cambia el código de país o ingresa el número sin el símbolo +"
                        ];
                    }
                }
            } else {
                if (empty($countryCode)) {
                    return [
                        'valid' => false,
                        'formatted' => null,
                        'error' => 'Debe proporcionar un código de país o un número con formato internacional (+34...)'
                    ];
                }
                $parsedNumber = $this->phoneUtil->parse($phoneNumber, strtoupper($countryCode));
            }

            // Validar que sea un número válido
            if (!$this->phoneUtil->isValidNumber($parsedNumber)) {
                $countryName = $this->getCountryName($parsedNumber->getCountryCode());
                return [
                    'valid' => false,
                    'formatted' => null,
                    'error' => "El número no es válido para {$countryName}"
                ];
            }

            // Formatear al formato internacional E.164 (+34612345678)
            $formattedNumber = $this->phoneUtil->format($parsedNumber, PhoneNumberFormat::E164);

            return [
                'valid' => true,
                'formatted' => $formattedNumber,
                'error' => null,
                'country_code' => $parsedNumber->getCountryCode(),
                'national_number' => $parsedNumber->getNationalNumber()
            ];

        } catch (NumberParseException $e) {
            return [
                'valid' => false,
                'formatted' => null,
                'error' => 'Formato de número inválido: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtiene el nombre del país por código numérico
     */
    private function getCountryName($countryCode) {
        $countries = [
            34 => 'España',
            33 => 'Francia',
            49 => 'Alemania',
            44 => 'Reino Unido',
            1 => 'Estados Unidos/Canadá',
            351 => 'Portugal',
            39 => 'Italia',
            58 => 'Venezuela',
            52 => 'México',
            54 => 'Argentina',
            56 => 'Chile',
            57 => 'Colombia',
            51 => 'Perú',
            55 => 'Brasil',
        ];

        return $countries[$countryCode] ?? "país con código +{$countryCode}";
    }

    /**
     * Obtiene el nombre del país por código ISO (ES, VE, etc.)
     */
    private function getCountryNameByISO($isoCode) {
        $countries = [
            'ES' => 'España',
            'FR' => 'Francia',
            'DE' => 'Alemania',
            'GB' => 'Reino Unido',
            'US' => 'Estados Unidos',
            'PT' => 'Portugal',
            'IT' => 'Italia',
            'VE' => 'Venezuela',
            'MX' => 'México',
            'AR' => 'Argentina',
            'CL' => 'Chile',
            'CO' => 'Colombia',
            'PE' => 'Perú',
            'BR' => 'Brasil',
        ];

        return $countries[$isoCode] ?? "país con código {$isoCode}";
    }

    /**
     * Extrae el código de país de un número en formato E.164
     */
    public static function extractCountryCode($e164Number) {
        if (empty($e164Number) || $e164Number[0] !== '+') {
            return null;
        }

        try {
            $phoneUtil = PhoneNumberUtil::getInstance();
            $parsedNumber = $phoneUtil->parse($e164Number, null);
            return '+' . $parsedNumber->getCountryCode();
        } catch (NumberParseException $e) {
            return null;
        }
    }

    /**
     * Extrae el número nacional (sin código de país)
     */
    public static function extractNationalNumber($e164Number) {
        if (empty($e164Number)) {
            return null;
        }

        try {
            $phoneUtil = PhoneNumberUtil::getInstance();
            $parsedNumber = $phoneUtil->parse($e164Number, null);
            return (string) $parsedNumber->getNationalNumber();
        } catch (NumberParseException $e) {
            return null;
        }
    }
}
