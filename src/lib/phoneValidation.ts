/**
 * Validación de números telefónicos usando libphonenumber-js
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Códigos de país completos con banderas (ordenados por relevancia)
 */
export const COUNTRY_CODES = [
  // España primero (más relevante)
  { code: '+34', country: 'ES', name: 'España', flag: '🇪🇸' },

  // Europa Occidental
  { code: '+33', country: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: '+49', country: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: '+44', country: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+39', country: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: '+31', country: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
  { code: '+32', country: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: '+41', country: 'CH', name: 'Suiza', flag: '🇨🇭' },
  { code: '+43', country: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: '+353', country: 'IE', name: 'Irlanda', flag: '🇮🇪' },
  { code: '+352', country: 'LU', name: 'Luxemburgo', flag: '🇱🇺' },
  { code: '+377', country: 'MC', name: 'Mónaco', flag: '🇲🇨' },

  // Europa del Norte
  { code: '+45', country: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
  { code: '+46', country: 'SE', name: 'Suecia', flag: '🇸🇪' },
  { code: '+47', country: 'NO', name: 'Noruega', flag: '🇳🇴' },
  { code: '+358', country: 'FI', name: 'Finlandia', flag: '🇫🇮' },
  { code: '+354', country: 'IS', name: 'Islandia', flag: '🇮🇸' },

  // Europa del Este
  { code: '+48', country: 'PL', name: 'Polonia', flag: '🇵🇱' },
  { code: '+420', country: 'CZ', name: 'República Checa', flag: '🇨🇿' },
  { code: '+421', country: 'SK', name: 'Eslovaquia', flag: '🇸🇰' },
  { code: '+36', country: 'HU', name: 'Hungría', flag: '🇭🇺' },
  { code: '+40', country: 'RO', name: 'Rumania', flag: '🇷🇴' },
  { code: '+359', country: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+7', country: 'RU', name: 'Rusia', flag: '🇷🇺' },
  { code: '+380', country: 'UA', name: 'Ucrania', flag: '🇺🇦' },
  { code: '+375', country: 'BY', name: 'Bielorrusia', flag: '🇧🇾' },
  { code: '+370', country: 'LT', name: 'Lituania', flag: '🇱🇹' },
  { code: '+371', country: 'LV', name: 'Letonia', flag: '🇱🇻' },
  { code: '+372', country: 'EE', name: 'Estonia', flag: '🇪🇪' },

  // Europa del Sur
  { code: '+30', country: 'GR', name: 'Grecia', flag: '🇬🇷' },
  { code: '+385', country: 'HR', name: 'Croacia', flag: '🇭🇷' },
  { code: '+386', country: 'SI', name: 'Eslovenia', flag: '🇸🇮' },
  { code: '+381', country: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: '+382', country: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: '+383', country: 'XK', name: 'Kosovo', flag: '🇽🇰' },
  { code: '+389', country: 'MK', name: 'Macedonia del Norte', flag: '🇲🇰' },
  { code: '+355', country: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: '+387', country: 'BA', name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  { code: '+90', country: 'TR', name: 'Turquía', flag: '🇹🇷' },
  { code: '+357', country: 'CY', name: 'Chipre', flag: '🇨🇾' },
  { code: '+356', country: 'MT', name: 'Malta', flag: '🇲🇹' },

  // América del Norte
  { code: '+1', country: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: '+52', country: 'MX', name: 'México', flag: '🇲🇽' },

  // América Central y Caribe
  { code: '+502', country: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', country: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+504', country: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: '+505', country: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', country: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', country: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: '+53', country: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: '+1', country: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: '+1', country: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+509', country: 'HT', name: 'Haití', flag: '🇭🇹' },
  { code: '+1', country: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: '+1', country: 'TT', name: 'Trinidad y Tobago', flag: '🇹🇹' },
  { code: '+1', country: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: '+1', country: 'BB', name: 'Barbados', flag: '🇧🇧' },

  // América del Sur
  { code: '+58', country: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+57', country: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: '+593', country: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+51', country: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: '+591', country: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+598', country: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+595', country: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+55', country: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: '+592', country: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: '+597', country: 'SR', name: 'Surinam', flag: '🇸🇷' },
  { code: '+594', country: 'GF', name: 'Guayana Francesa', flag: '🇬🇫' },

  // Asia Oriental
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: '+82', country: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: '+850', country: 'KP', name: 'Corea del Norte', flag: '🇰🇵' },
  { code: '+886', country: 'TW', name: 'Taiwán', flag: '🇹🇼' },
  { code: '+852', country: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+853', country: 'MO', name: 'Macao', flag: '🇲🇴' },
  { code: '+976', country: 'MN', name: 'Mongolia', flag: '🇲🇳' },

  // Sudeste Asiático
  { code: '+66', country: 'TH', name: 'Tailandia', flag: '🇹🇭' },
  { code: '+84', country: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+60', country: 'MY', name: 'Malasia', flag: '🇲🇾' },
  { code: '+65', country: 'SG', name: 'Singapur', flag: '🇸🇬' },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'Filipinas', flag: '🇵🇭' },
  { code: '+95', country: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+855', country: 'KH', name: 'Camboya', flag: '🇰🇭' },
  { code: '+856', country: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: '+673', country: 'BN', name: 'Brunéi', flag: '🇧🇳' },
  { code: '+670', country: 'TL', name: 'Timor Oriental', flag: '🇹🇱' },

  // Asia Meridional
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'PK', name: 'Pakistán', flag: '🇵🇰' },
  { code: '+880', country: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: '+975', country: 'BT', name: 'Bután', flag: '🇧🇹' },
  { code: '+960', country: 'MV', name: 'Maldivas', flag: '🇲🇻' },
  { code: '+93', country: 'AF', name: 'Afganistán', flag: '🇦🇫' },

  // Oriente Medio
  { code: '+971', country: 'AE', name: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  { code: '+966', country: 'SA', name: 'Arabia Saudita', flag: '🇸🇦' },
  { code: '+972', country: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: '+962', country: 'JO', name: 'Jordania', flag: '🇯🇴' },
  { code: '+961', country: 'LB', name: 'Líbano', flag: '🇱🇧' },
  { code: '+963', country: 'SY', name: 'Siria', flag: '🇸🇾' },
  { code: '+964', country: 'IQ', name: 'Irak', flag: '🇮🇶' },
  { code: '+98', country: 'IR', name: 'Irán', flag: '🇮🇷' },
  { code: '+965', country: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', country: 'QA', name: 'Catar', flag: '🇶🇦' },
  { code: '+973', country: 'BH', name: 'Baréin', flag: '🇧🇭' },
  { code: '+968', country: 'OM', name: 'Omán', flag: '🇴🇲' },
  { code: '+967', country: 'YE', name: 'Yemen', flag: '🇾🇪' },

  // África del Norte
  { code: '+20', country: 'EG', name: 'Egipto', flag: '🇪🇬' },
  { code: '+212', country: 'MA', name: 'Marruecos', flag: '🇲🇦' },
  { code: '+213', country: 'DZ', name: 'Argelia', flag: '🇩🇿' },
  { code: '+216', country: 'TN', name: 'Túnez', flag: '🇹🇳' },
  { code: '+218', country: 'LY', name: 'Libia', flag: '🇱🇾' },
  { code: '+249', country: 'SD', name: 'Sudán', flag: '🇸🇩' },

  // África Occidental
  { code: '+234', country: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: '+225', country: 'CI', name: 'Costa de Marfil', flag: '🇨🇮' },
  { code: '+221', country: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: '+223', country: 'ML', name: 'Malí', flag: '🇲🇱' },
  { code: '+226', country: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+227', country: 'NE', name: 'Níger', flag: '🇳🇪' },
  { code: '+228', country: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: '+229', country: 'BJ', name: 'Benín', flag: '🇧🇯' },

  // África Oriental
  { code: '+254', country: 'KE', name: 'Kenia', flag: '🇰🇪' },
  { code: '+255', country: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: '+250', country: 'RW', name: 'Ruanda', flag: '🇷🇼' },
  { code: '+251', country: 'ET', name: 'Etiopía', flag: '🇪🇹' },
  { code: '+252', country: 'SO', name: 'Somalia', flag: '🇸🇴' },

  // África Austral
  { code: '+27', country: 'ZA', name: 'Sudáfrica', flag: '🇿🇦' },
  { code: '+264', country: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: '+267', country: 'BW', name: 'Botsuana', flag: '🇧🇼' },
  { code: '+268', country: 'SZ', name: 'Esuatini', flag: '🇸🇿' },
  { code: '+266', country: 'LS', name: 'Lesoto', flag: '🇱🇸' },
  { code: '+260', country: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'ZW', name: 'Zimbabue', flag: '🇿🇼' },
  { code: '+258', country: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: '+261', country: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: '+230', country: 'MU', name: 'Mauricio', flag: '🇲🇺' },

  // Oceanía
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', name: 'Nueva Zelanda', flag: '🇳🇿' },
  { code: '+679', country: 'FJ', name: 'Fiyi', flag: '🇫🇯' },
  { code: '+675', country: 'PG', name: 'Papúa Nueva Guinea', flag: '🇵🇬' },
  { code: '+676', country: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: '+685', country: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: '+686', country: 'KI', name: 'Kiribati', flag: '🇰🇮' },
];

/**
 * Interfaz de resultado de validación
 */
export interface PhoneValidationResult {
  valid: boolean;
  formatted?: string; // Formato E.164 (+34612345678)
  national?: string; // Formato nacional (612 34 56 78)
  international?: string; // Formato internacional (+34 612 34 56 78)
  country?: string; // Código ISO del país (ES, FR, etc.)
  error?: string;
}

/**
 * Valida un número de teléfono
 *
 * @param phoneNumber - Número de teléfono (puede incluir código de país)
 * @param countryCode - Código de país ISO 2 letras (ej: ES, US, FR)
 * @returns Resultado de validación con número formateado
 */
export function validatePhoneNumber(
  phoneNumber: string,
  countryCode?: string
): PhoneValidationResult {
  // Si no hay número, retornar válido (campo opcional)
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { valid: true };
  }

  try {
    // Si el número ya tiene +, lo parseamos sin país de referencia
    // Si no tiene +, usamos el país proporcionado
    const hasPlus = phoneNumber.trim().startsWith('+');

    if (hasPlus) {
      // Ya tiene formato internacional
      if (!isValidPhoneNumber(phoneNumber)) {
        return {
          valid: false,
          error: 'El número de teléfono no es válido'
        };
      }

      const parsed = parsePhoneNumber(phoneNumber);

      // NUEVA VALIDACIÓN: Verificar que el código del número coincida con el seleccionado
      if (countryCode) {
        const expectedCountry = countryCode.toUpperCase() as CountryCode;
        const actualCountry = parsed.country;

        if (actualCountry !== expectedCountry) {
          const expectedCountryName = getCountryName(expectedCountry);
          const actualCountryName = getCountryName(actualCountry || '');

          return {
            valid: false,
            error: `El número pertenece a ${actualCountryName}, pero seleccionaste ${expectedCountryName}. Por favor, cambia el código de país o ingresa el número sin el símbolo +`
          };
        }
      }

      return {
        valid: true,
        formatted: parsed.format('E.164'), // +34612345678
        national: parsed.formatNational(), // 612 34 56 78
        international: parsed.formatInternational(), // +34 612 34 56 78
        country: parsed.country
      };
    } else {
      // No tiene +, necesitamos país
      if (!countryCode) {
        return {
          valid: false,
          error: 'Debe seleccionar un código de país'
        };
      }

      const fullNumber = phoneNumber;
      const country = countryCode.toUpperCase() as CountryCode;

      if (!isValidPhoneNumber(fullNumber, country)) {
        return {
          valid: false,
          error: `El número no es válido para ${getCountryName(country)}`
        };
      }

      const parsed = parsePhoneNumber(fullNumber, country);

      return {
        valid: true,
        formatted: parsed.format('E.164'),
        national: parsed.formatNational(),
        international: parsed.formatInternational(),
        country: parsed.country
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Formato de número inválido'
    };
  }
}

/**
 * Obtiene el nombre del país por código ISO
 */
function getCountryName(countryCode: string): string {
  const country = COUNTRY_CODES.find(c => c.country === countryCode);
  return country?.name || countryCode;
}

/**
 * Formatea un número de teléfono para mostrar
 *
 * @param phoneNumber - Número en formato E.164
 * @returns Número formateado para mostrar
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '';

  try {
    const parsed = parsePhoneNumber(phoneNumber);
    return parsed.formatInternational(); // +34 612 34 56 78
  } catch {
    return phoneNumber;
  }
}

/**
 * Extrae el código de país de un número en formato E.164
 *
 * @param e164Number - Número en formato E.164 (+34612345678)
 * @returns Código de país con + (+34)
 */
export function extractCountryCode(e164Number: string): string | null {
  if (!e164Number || !e164Number.startsWith('+')) {
    return null;
  }

  try {
    const parsed = parsePhoneNumber(e164Number);
    return `+${parsed.countryCallingCode}`;
  } catch {
    return null;
  }
}

/**
 * Extrae el número nacional (sin código de país)
 *
 * @param e164Number - Número en formato E.164
 * @returns Número nacional
 */
export function extractNationalNumber(e164Number: string): string | null {
  if (!e164Number) return null;

  try {
    const parsed = parsePhoneNumber(e164Number);
    return parsed.nationalNumber;
  } catch {
    return null;
  }
}
