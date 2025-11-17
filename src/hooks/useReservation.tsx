import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { reservationService, extractData, handleApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface ReservationData {
  id: number;
  reservation_code: string;
  accommodation_id: number;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  total_guests: number;
  registered_guests: number;
  all_guests_registered: boolean;
  status: string;
  cliente_id: number;
  accommodation_name?: string;
  host_name?: string;
  host_email?: string;
  host_phone?: string;
}

interface GuestData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_responsible: boolean;
}

interface PreferenceData {
  needs_crib: boolean;
  double_beds: number;
  single_beds: number;
  sofa_beds: number;
  estimated_arrival_time: string | null;
  additional_info: string | null;
}

interface ReservationContextType {
  reservationCode: string | null;
  reservationData: ReservationData | null;
  guests: GuestData[];
  preferences: PreferenceData | null;
  loading: boolean;
  error: string | null;
  refreshReservation: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [preferences, setPreferences] = useState<PreferenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leer parámetro 'reserva' o 'reservation' de la URL (compatibilidad)
  useEffect(() => {
    const code = searchParams.get('reserva') || searchParams.get('reservation');
    if (code) {
      setReservationCode(code);
    } else {
      // Si no hay código de reserva, simplemente no cargamos nada
      // Esto permite que la página funcione sin el parámetro
      setReservationCode(null);
      setReservationData(null);
      setLoading(false);
    }
  }, [searchParams]);

  // Cargar datos de la reserva cuando tengamos el código
  const loadReservation = async () => {
    if (!reservationCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await reservationService.getByCode(reservationCode);
      const data = extractData<{
        reservation: ReservationData;
        guests: GuestData[];
        preferences: PreferenceData;
      }>(response);

      setReservationData(data.reservation);
      setGuests(data.guests || []);
      setPreferences(data.preferences || null);
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);

      // Si la reserva no existe (404 o similar), redirigir a página de error
      if (err.response?.status === 404 || errorMessage.includes('no encontrad')) {
        console.error('Reserva no encontrada:', reservationCode);
        // Redirigir a página 404
        navigate('/404', { replace: true });
      } else {
        // Otros errores, mostrar toast
        toast({
          title: 'Error al cargar reserva',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservationCode) {
      loadReservation();
    }
  }, [reservationCode]);

  const refreshReservation = async () => {
    await loadReservation();
  };

  return (
    <ReservationContext.Provider
      value={{
        reservationCode,
        reservationData,
        guests,
        preferences,
        loading,
        error,
        refreshReservation,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
