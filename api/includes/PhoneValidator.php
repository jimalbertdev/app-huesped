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

        $phoneNumber = trim($phoneNumber);

        // INTENTO 1: Validar tal cual viene (con o sin código de país, usando el countryCode si está disponible)
        $isValid1 = false;
        $parsedNumber1 = null;
        $error1 = null;

        try {
            // Si tiene +, parsear sin región por defecto. Si no, usar región.
            $region = (strpos($phoneNumber, '+') === 0) ? null : strtoupper($countryCode);
            $parsedNumber1 = $this->phoneUtil->parse($phoneNumber, $region);
            
            if ($this->phoneUtil->isValidNumber($parsedNumber1)) {
                $isValid1 = true;
            } else {
                $countryName = $this->getCountryName($parsedNumber1->getCountryCode());
                $error1 = "El número no es válido para {$countryName}";
            }
        } catch (NumberParseException $e) {
            $error1 = 'Formato de número inválido';
        }

        if ($isValid1) {
            return $this->formatSuccess($parsedNumber1, $countryCode);
        }

        // INTENTO 2: Si falló y no tenía +, intentar agregando + (asumiendo que el usuario puso el código de país ej: 34600...)
        if (strpos($phoneNumber, '+') !== 0) {
            try {
                $phoneNumberWithPlus = '+' . $phoneNumber;
                $parsedNumber2 = $this->phoneUtil->parse($phoneNumberWithPlus, null);

                if ($this->phoneUtil->isValidNumber($parsedNumber2)) {
                    return $this->formatSuccess($parsedNumber2, $countryCode);
                }
            } catch (NumberParseException $e) {
                // Ignorar error del segundo intento
            }
        }

        // Si llegamos aquí, ninguna validación funcionó. Devolver el error del primer intento (el más relevante)
        return [
            'valid' => false,
            'formatted' => null,
            'error' => $error1 ?? 'Número de teléfono inválido'
        ];
    }

    /**
     * Helper para formatear respuesta exitosa y validar coincidencia de país
     */
    private function formatSuccess($parsedNumber, $expectedCountryCode) {
        // Verificar coincidencia de país si se solicitó
        if (!empty($expectedCountryCode)) {
            $expectedRegion = strtoupper($expectedCountryCode);
            $actualRegion = $this->phoneUtil->getRegionCodeForNumber($parsedNumber);
            
            // Si la región es diferente, verificar si es compatible (ej: NANP US/CA) o si es un error real
            if ($actualRegion !== $expectedRegion) {
                // Permitir si el código de país numérico coincide (ej: +1 para US y CA)
                // O si la región actual es desconocida (ZZ) pero el número es válido
                if ($actualRegion !== 'ZZ') {
                     $expectedCountryName = $this->getCountryNameByISO($expectedRegion);
                     $actualCountryName = $this->getCountryNameByISO($actualRegion);
                     
                     // Si los códigos de llamada son diferentes, es un error seguro
                     // Si son iguales (ej: US/CA +1), podríamos ser permisivos, pero por ahora estricto con advertencia
                     // NOTA: Para este caso específico del usuario, si pone 34... y selecciona ES, coincidirá.
                     
                     // Vamos a ser permisivos si el código de llamada coincide con el esperado para esa región
                     $expectedCallingCode = $this->phoneUtil->getCountryCodeForRegion($expectedRegion);
                     $actualCallingCode = $parsedNumber->getCountryCode();
                     
                     if ($expectedCallingCode !== $actualCallingCode) {
                        return [
                            'valid' => false,
                            'formatted' => null,
                            'error' => "El número pertenece a {$actualCountryName} (+{$actualCallingCode}), pero seleccionaste {$expectedCountryName} (+{$expectedCallingCode})."
                        ];
                     }
                }
            }
        }

        $formattedNumber = $this->phoneUtil->format($parsedNumber, PhoneNumberFormat::E164);

        return [
            'valid' => true,
            'formatted' => $formattedNumber,
            'error' => null,
            'country_code' => $parsedNumber->getCountryCode(),
            'national_number' => $parsedNumber->getNationalNumber()
        ];
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
