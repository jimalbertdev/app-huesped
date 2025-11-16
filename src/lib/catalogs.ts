/**
 * Catálogos de datos estáticos para el formulario de registro
 * Estos datos no cambian frecuentemente y se mantienen en el frontend
 */

// ============================================
// TIPOS DE DOCUMENTO
// ============================================
export const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI - DNI Español', requiresSecondSurname: true, requiresSupport: true },
  { value: 'NIE', label: 'NIE - Número de identidad de extranjero Español', requiresSecondSurname: true, requiresSupport: true },
  { value: 'PAS', label: 'Pasaporte', requiresSecondSurname: false, requiresSupport: false },
  { value: 'OTRO', label: 'Otro documento', requiresSecondSurname: false, requiresSupport: false }
] as const;

// ============================================
// TIPOS DE PARENTESCO
// ============================================
export const RELATIONSHIP_TYPES = [
  { value: 'HJ', label: 'Hijo/a' },
  { value: 'HR', label: 'Hermano/a' },
  { value: 'AB', label: 'Abuelo/a' },
  { value: 'NI', label: 'Nieto/a' },
  { value: 'PM', label: 'Primo/a' },
  { value: 'TI', label: 'Tío/a' },
  { value: 'SB', label: 'Sobrino/a' },
  { value: 'CY', label: 'Cónyuge' },
  { value: 'CD', label: 'Cuñado/a' },
  { value: 'SG', label: 'Suegro/a' },
  { value: 'YN', label: 'Yerno/Nuera' },
  { value: 'BA', label: 'Bisabuelo/a' },
  { value: 'BN', label: 'Bisnieto/a' },
  { value: 'TU', label: 'Tutor/a' },
  { value: 'OT', label: 'Otro' }
] as const;

// ============================================
// OPCIONES DE SEXO
// ============================================
export const SEX_OPTIONS = [
  { value: 'm', label: 'Masculino' },
  { value: 'f', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer-not', label: 'Prefiero no decir' }
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verifica si un tipo de documento requiere segundo apellido
 */
export const requiresSecondSurname = (documentType: string): boolean => {
  const doc = DOCUMENT_TYPES.find(d => d.value === documentType);
  return doc?.requiresSecondSurname ?? false;
};

/**
 * Verifica si un tipo de documento requiere número de soporte
 */
export const requiresSupportNumber = (documentType: string): boolean => {
  const doc = DOCUMENT_TYPES.find(d => d.value === documentType);
  return doc?.requiresSupport ?? false;
};

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Verifica si una persona es menor de edad
 */
export const isMinor = (birthDate: string): boolean => {
  return calculateAge(birthDate) < 18;
};
