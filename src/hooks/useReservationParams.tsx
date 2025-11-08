import { useSearchParams } from 'react-router-dom';

/**
 * Hook personalizado para manejar el parámetro de reserva en las URLs
 * Mantiene la persistencia del código de reserva entre navegaciones
 */
export const useReservationParams = () => {
  const [searchParams] = useSearchParams();

  /**
   * Obtiene el código de reserva de la URL
   * Acepta tanto 'reserva' como 'reservation' por compatibilidad
   */
  const getReservationCode = (): string | null => {
    return searchParams.get('reserva') || searchParams.get('reservation');
  };

  /**
   * Construye una URL con el parámetro de reserva preservado
   * @param path - Ruta destino (ej: "/dashboard", "/register")
   * @returns URL completa con parámetro de reserva
   */
  const buildPathWithReservation = (path: string): string => {
    const code = getReservationCode();
    if (!code) return path;

    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}reserva=${code}`;
  };

  /**
   * Retorna el string de query params completo con el código de reserva
   * @returns String de query params (ej: "?reserva=RES-2024-001")
   */
  const getReservationQueryString = (): string => {
    const code = getReservationCode();
    return code ? `?reserva=${code}` : '';
  };

  return {
    reservationCode: getReservationCode(),
    buildPathWithReservation,
    getReservationQueryString,
  };
};
