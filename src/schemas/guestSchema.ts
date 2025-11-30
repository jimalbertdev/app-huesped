/**
 * Schemas de validación Zod para el formulario de registro de huéspedes
 * Incluye validaciones condicionales complejas según normativa policial española
 */

import { z } from 'zod';
import { validatePhoneNumber, COUNTRY_CODES } from '@/lib/phoneValidation';

// ============================================
// SCHEMA BASE
// ============================================

const baseGuestSchema = z.object({
  // Información del Documento
  document_type: z.enum(['DNI', 'NIE', 'NIF', 'CIF', 'PAS', 'OTRO'], {
    required_error: "Selecciona un tipo de documento",
    invalid_type_error: "Tipo de documento inválido"
  }),
  document_number: z.string().min(1, "El número de documento es obligatorio"),
  support_number: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),

  // Información Personal
  nationality: z.string().min(2, "La nacionalidad es obligatoria"),
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().min(1, "El primer apellido es obligatorio"),
  second_last_name: z.string().optional(),
  birth_date: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  sex: z.enum(['m', 'f', 'other', 'prefer-not'], {
    required_error: "Selecciona el sexo"
  }),
  relationship: z.enum(['AB', 'BA', 'BN', 'CD', 'CY', 'HJ', 'HR', 'NI', 'OT', 'PM', 'SB', 'SG', 'TI', 'TU', 'YN']).optional(),

  // Información de Residencia
  residence_country: z.string().min(2, "El país de residencia es obligatorio"),
  residence_municipality_code: z.string().optional(),
  residence_municipality_name: z.string().optional(),
  residence_postal_code: z.string().optional(),
  residence_address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),

  // Información de Contacto
  phone_country_code: z.string().min(1, "Selecciona el código de país del teléfono"),
  phone: z.string().min(6, "El número de teléfono debe tener al menos 6 dígitos"),
  email: z.string().email("El formato del email no es válido").min(1, "El email es obligatorio"),

  // Metadata
  is_responsible: z.boolean().default(false),
  registration_method: z.enum(['scan', 'manual']).default('manual').optional(),
});

// ============================================
// SCHEMA CON VALIDACIONES CONDICIONALES
// ============================================

export const extendedGuestSchema = baseGuestSchema
  // VALIDACIÓN 1: DNI/NIE requieren segundo apellido
  .refine((data) => {
    if (['DNI', 'NIE'].includes(data.document_type)) {
      return !!data.second_last_name && data.second_last_name.trim().length > 0;
    }
    return true;
  }, {
    message: "El segundo apellido es obligatorio para documentos DNI/NIE",
    path: ["second_last_name"]
  })

  // VALIDACIÓN 2: DNI/NIE requieren número de soporte
  .refine((data) => {
    if (['DNI', 'NIE'].includes(data.document_type)) {
      return !!data.support_number && data.support_number.trim().length > 0;
    }
    return true;
  }, {
    message: "El número de soporte es obligatorio para documentos DNI/NIE",
    path: ["support_number"]
  })

  // VALIDACIÓN 3: España requiere municipio
  .refine((data) => {
    const country = data.residence_country.toUpperCase();
    if (['ES', 'ESP'].includes(country)) {
      return !!data.residence_municipality_code || !!data.residence_municipality_name;
    }
    return true;
  }, {
    message: "Debes seleccionar un municipio español",
    path: ["residence_municipality_code"]
  })

  // VALIDACIÓN 4: Otro país requiere ciudad
  .refine((data) => {
    const country = data.residence_country.toUpperCase();
    if (!['ES', 'ESP'].includes(country)) {
      return !!data.residence_municipality_name && data.residence_municipality_name.trim().length > 0;
    }
    return true;
  }, {
    message: "Debes indicar la ciudad de residencia",
    path: ["residence_municipality_name"]
  })

  // VALIDACIÓN 5: Fecha vencimiento > fecha expedición
  .refine((data) => {
    if (data.issue_date && data.expiry_date) {
      return new Date(data.expiry_date) > new Date(data.issue_date);
    }
    return true;
  }, {
    message: "La fecha de vencimiento debe ser posterior a la de expedición",
    path: ["expiry_date"]
  })

  // VALIDACIÓN 6: Documento no vencido
  .refine((data) => {
    if (data.expiry_date) {
      return new Date(data.expiry_date) >= new Date();
    }
    return true;
  }, {
    message: "El documento está vencido. Por favor, renuévalo antes de registrarte",
    path: ["expiry_date"]
  })

  // VALIDACIÓN 7: Menor de edad requiere parentesco
  .refine((data) => {
    if (!data.birth_date) return true;

    const birthDate = new Date(data.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      return !!data.relationship;
    }
    return true;
  }, {
    message: "El parentesco es obligatorio para menores de 18 años",
    path: ["relationship"]
  })

  // VALIDACIÓN 8: Edad razonable (0-120 años)
  .refine((data) => {
    if (!data.birth_date) return true;

    const birthDate = new Date(data.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 && age <= 120;
  }, {
    message: "La fecha de nacimiento no es válida",
    path: ["birth_date"]
  })

  // VALIDACIÓN 9: Teléfono válido para el país seleccionado
  .refine((data) => {
    if (!data.phone || data.phone.trim() === '') {
      return true; // Campo opcional
    }

    // Mapear código de teléfono a código ISO del país
    const countryISO = COUNTRY_CODES.find(c => c.code === data.phone_country_code)?.country;

    if (!countryISO) {
      return false; // Código de país no válido
    }

    // Validar el número con libphonenumber-js
    const validation = validatePhoneNumber(data.phone, countryISO);

    return validation.valid;
  }, {
    message: "El número de teléfono no es válido para el país seleccionado",
    path: ["phone"]
  });

// ============================================
// TIPOS DERIVADOS
// ============================================

export type ExtendedGuestFormData = z.infer<typeof extendedGuestSchema>;

// ============================================
// INTERFACES AUXILIARES
// ============================================

export interface Country {
  code: string;
  code_alpha3: string;
  name: string;
  phone_prefix: string | null;
}

export interface Municipality {
  code: string;
  name: string;
  postal_code: string;
  display_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
