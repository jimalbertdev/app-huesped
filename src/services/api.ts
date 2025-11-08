import axios from 'axios';

// Determinar URL base según el entorno
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // En producción, usar la misma URL del servidor
    return `${window.location.protocol}//${window.location.host}/app_huesped/api`;
  }
  // En desarrollo, usar siempre localhost.local
  return 'http://localhost.local/app_huesped/api';
};

const API_BASE_URL = getApiBaseUrl();

// Instancia de axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// SERVICIOS ESPECÍFICOS
// ============================================

// Reservas
export const reservationService = {
  /**
   * Obtener reserva por código
   */
  getByCode: (code: string) =>
    api.get(`/reservations/${code}`),

  /**
   * Obtener datos completos para el dashboard
   */
  getDashboard: (id: number) =>
    api.get(`/reservations/${id}/dashboard`),
};

// Huéspedes
export const guestService = {
  /**
   * Registrar nuevo huésped
   */
  create: (data: {
    reservation_id: number;
    document_type: 'dni' | 'nie' | 'passport' | 'other';
    document_number: string;
    nationality: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    sex: 'm' | 'f' | 'other' | 'prefer-not';
    phone?: string;
    email?: string;
    is_responsible?: boolean;
    registration_method?: 'scan' | 'manual';
    document_image_path?: string;
    accepted_terms?: boolean;
  }) => api.post('/guests', data),

  /**
   * Crear huésped con firma (FormData)
   */
  createWithSignature: (formData: FormData) =>
    api.post('/guests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  /**
   * Obtener huésped por ID
   */
  getById: (id: number) =>
    api.get(`/guests/${id}`),

  /**
   * Obtener huéspedes de una reserva
   */
  getByReservation: (reservationId: number) =>
    api.get(`/guests/reservation/${reservationId}`),

  /**
   * Actualizar huésped
   */
  update: (id: number, data: any) =>
    api.put(`/guests/${id}`, data),
};

// Preferencias
export const preferenceService = {
  /**
   * Obtener preferencias de una reserva
   */
  get: (reservationId: number) =>
    api.get(`/preferences/${reservationId}`),

  /**
   * Guardar o actualizar preferencias
   */
  save: (data: {
    reservation_id: number;
    needs_crib?: boolean;
    double_beds?: number;
    single_beds?: number;
    sofa_beds?: number;
    estimated_arrival_time?: string;
    additional_info?: string;
    allergies?: string;
    special_requests?: string;
  }) => api.post('/preferences', data),
};

// Puertas / Cerraduras
export const doorService = {
  /**
   * Intentar abrir puerta
   */
  unlock: (data: {
    reservation_id: number;
    guest_id?: number;
    door_type: 'portal' | 'accommodation';
  }) => api.post('/doors/unlock', data),

  /**
   * Obtener historial de aperturas
   */
  getHistory: (reservationId: number) =>
    api.get(`/doors/history/${reservationId}`),
};

// Incidencias
export const incidentService = {
  /**
   * Crear incidencia
   */
  create: (data: {
    reservation_id: number;
    guest_id?: number;
    incident_type: 'complaint' | 'suggestion' | 'maintenance' | 'emergency';
    title?: string;
    description: string;
  }) => api.post('/incidents', data),

  /**
   * Obtener incidencias de una reserva
   */
  getByReservation: (reservationId: number) =>
    api.get(`/incidents/${reservationId}`),
};

// Health Check
export const healthCheck = () => api.get('/health');

// ============================================
// TIPOS DE RESPUESTA
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extraer datos de respuesta de la API
 */
export const extractData = <T>(response: any): T => {
  return response.data.data;
};

/**
 * Manejar error de API
 */
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Error desconocido en la operación';
};
