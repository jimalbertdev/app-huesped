/**
 * Validaciones de documentos españoles (DNI y NIE)
 * Basado en normativa oficial de la Policía Nacional de España
 */

/**
 * Tabla oficial de letras del DNI español
 */
const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Equivalencias para NIE: X=0, Y=1, Z=2
 */
const EQUIVALENCIAS_NIE: Record<string, string> = {
  'X': '0',
  'Y': '1',
  'Z': '2'
};

/**
 * Calcula la letra de control del DNI español
 */
function calcularLetraDni(numero: string): string {
  const posicion = parseInt(numero) % 23;
  return LETRAS_DNI[posicion];
}

/**
 * Calcula la letra de control del NIE español
 */
function calcularLetraNie(primeraLetra: string, numero: string): string {
  const numeroCompleto = EQUIVALENCIAS_NIE[primeraLetra] + numero;
  const posicion = parseInt(numeroCompleto) % 23;
  return LETRAS_DNI[posicion];
}

/**
 * Ejemplos de documentos que NO deben permitirse como valores reales
 */
const EJEMPLOS_PROHIBIDOS = [
  '12345678Z',  // Ejemplo de DNI
  'X1234567L',  // Ejemplo de NIE
  'Y1234567X',  // Ejemplo de NIE
  'Z1234567R',  // Ejemplo de NIE
  '00000000T',  // DNI inválido común
];

/**
 * Validación específica para DNI español
 * Formato: 8 dígitos + 1 letra (ejemplo: 12345678Z)
 */
export function validateDNI(dni: string): { valid: boolean; error?: string } {
  const dniClean = dni.toUpperCase().trim();

  // 0. Validar que no sea un ejemplo prohibido
  if (EJEMPLOS_PROHIBIDOS.includes(dniClean)) {
    return {
      valid: false,
      error: 'No puedes usar el número de ejemplo. Por favor, introduce tu DNI real'
    };
  }

  // 1. Validar formato básico: 8 dígitos + 1 letra
  if (!/^[0-9]{8}[A-Z]$/.test(dniClean)) {
    return {
      valid: false,
      error: 'El DNI debe tener exactamente 8 dígitos seguidos de una letra (ejemplo: 12345678Z)'
    };
  }

  const numero = dniClean.substring(0, 8);
  const letra = dniClean.substring(8, 9);

  // 2. Validar que no sea un número inválido
  if (numero === '00000000') {
    return {
      valid: false,
      error: 'El número del DNI no puede ser 00000000'
    };
  }

  // 3. Validar que el número esté en el rango válido
  const numeroInt = parseInt(numero);
  if (numeroInt < 1 || numeroInt > 99999999) {
    return {
      valid: false,
      error: 'El número del DNI debe estar entre 00000001 y 99999999'
    };
  }

  // 4. Calcular y validar letra de control
  const letraCorrecta = calcularLetraDni(numero);

  if (letra !== letraCorrecta) {
    return {
      valid: false,
      error: `La letra del DNI es incorrecta. Para el número ${numero}, la letra correcta es ${letraCorrecta}`
    };
  }

  return { valid: true };
}

/**
 * Validación específica para NIE español
 * Formato: X/Y/Z + 7 dígitos + 1 letra (ejemplo: X1234567L)
 */
export function validateNIE(nie: string): { valid: boolean; error?: string } {
  const nieClean = nie.toUpperCase().trim();

  // 0. Validar que no sea un ejemplo prohibido
  if (EJEMPLOS_PROHIBIDOS.includes(nieClean)) {
    return {
      valid: false,
      error: 'No puedes usar el número de ejemplo. Por favor, introduce tu NIE real'
    };
  }

  // 1. Validar formato básico: X/Y/Z + 7 dígitos + 1 letra
  if (!/^[XYZ][0-9]{7}[A-Z]$/.test(nieClean)) {
    return {
      valid: false,
      error: 'El NIE debe empezar por X, Y o Z, seguido de 7 dígitos y una letra (ejemplo: X1234567L)'
    };
  }

  const primeraLetra = nieClean.substring(0, 1);
  const numero = nieClean.substring(1, 8);
  const letra = nieClean.substring(8, 9);

  // 2. Validar que no sea un número inválido
  if (numero === '0000000') {
    return {
      valid: false,
      error: 'El número del NIE no puede ser 0000000'
    };
  }

  // 3. Validar rango del número
  const numeroInt = parseInt(numero);
  if (numeroInt < 1 || numeroInt > 9999999) {
    return {
      valid: false,
      error: 'El número del NIE debe estar entre 0000001 y 9999999'
    };
  }

  // 4. Calcular y validar letra de control
  const letraCorrecta = calcularLetraNie(primeraLetra, numero);

  if (letra !== letraCorrecta) {
    return {
      valid: false,
      error: `La letra del NIE es incorrecta. Para ${primeraLetra}${numero}, la letra correcta es ${letraCorrecta}`
    };
  }

  return { valid: true };
}

/**
 * Validación genérica de documento según tipo
 */
export function validateDocument(
  documentType: string,
  documentNumber: string
): { valid: boolean; error?: string } {
  const type = documentType.toUpperCase();

  switch (type) {
    case 'DNI':
      return validateDNI(documentNumber);
    case 'NIE':
      return validateNIE(documentNumber);
    default:
      // Para otros tipos de documento, solo validar que no esté vacío
      if (!documentNumber || documentNumber.trim().length === 0) {
        return {
          valid: false,
          error: 'El número de documento es obligatorio'
        };
      }
      return { valid: true };
  }
}

/**
 * Formatea un DNI agregando la letra de control si solo tiene números
 */
export function formatDNI(numero: string): string | null {
  const numeroClean = numero.trim();

  // Si ya tiene letra, devolverlo en mayúsculas
  if (/^[0-9]{8}[A-Z]$/i.test(numeroClean)) {
    return numeroClean.toUpperCase();
  }

  // Si solo tiene 8 dígitos, calcular y agregar letra
  if (/^[0-9]{8}$/.test(numeroClean)) {
    const letra = calcularLetraDni(numeroClean);
    return numeroClean + letra;
  }

  return null;
}

/**
 * Formatea un NIE agregando la letra de control si solo tiene el prefijo y números
 */
export function formatNIE(numero: string): string | null {
  const numeroClean = numero.toUpperCase().trim();

  // Si ya tiene el formato completo, devolverlo
  if (/^[XYZ][0-9]{7}[A-Z]$/.test(numeroClean)) {
    return numeroClean;
  }

  // Si solo tiene prefijo + 7 dígitos, calcular y agregar letra
  if (/^[XYZ][0-9]{7}$/.test(numeroClean)) {
    const primeraLetra = numeroClean.substring(0, 1);
    const numero = numeroClean.substring(1, 8);
    const letra = calcularLetraNie(primeraLetra, numero);
    return numeroClean + letra;
  }

  return null;
}
