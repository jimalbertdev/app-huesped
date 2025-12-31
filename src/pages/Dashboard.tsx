import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Home,
  Settings,
  User,
  Phone,
  Mail,
  BookOpen,
  Video,
  MapPin,
  AlertCircle,
  Lock,
  Menu,
  Unlock,
  Bed,
  Clock,
  MessageSquare,
  Plus,
  Minus,
  FileText,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { doorService, preferenceService, incidentService, accommodationService, suggestionService, handleApiError } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import vacanflyLogo from "@/assets/vacanfly-logo.png";
import { ShareDialog } from "@/components/ShareDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LiteYouTube } from "@/components/LiteYouTube";

const Dashboard = () => {
  const { language, setLanguage, t, getLanguageName, translateCategory } = useLanguage();
  const { reservationData, loading, error, guests } = useReservation();
  const { buildPathWithReservation } = useReservationParams();
  const { toast } = useToast();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showSuperHost, setShowSuperHost] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Obtener contrato del huésped responsable
  // Obtener contrato del huésped responsable
  const responsibleGuest = guests.find(g => g.is_responsible);
  // const contractPath = responsibleGuest?.contract_path; // Ya no se usa, usamos reservationData.contract_path
  // console.log(reservationData);
  // Obtener datos de la reserva - Sin valores por defecto, mostrar '?' si no hay datos
  const totalGuests = Number(reservationData?.total_guests || 0);
  const registeredGuests = Number(reservationData?.registered_guests || 0);
  const reservationCode = reservationData?.reservation_code || '?';
  const checkInDate = reservationData?.check_in_date || '?';
  const checkInTime = reservationData?.check_in_time || '?';
  const checkOutDate = reservationData?.check_out_date || '?';
  const checkOutTime = reservationData?.check_out_time || '?';
  const hostName = reservationData?.host_name || '?';
  const hostPhone = reservationData?.host_phone || '?';
  const hostEmail = reservationData?.host_email || '?';
  const hostPhotoUrl = reservationData?.host_photo_url;
  const superHostName = reservationData?.super_host_name;
  const superHostPhone = reservationData?.super_host_phone;
  const superHostEmail = reservationData?.super_host_email;
  const superHostPhotoUrl = reservationData?.super_host_photo_url;
  const accommodationName = reservationData?.accommodation_name || '?';

  // Configuración unificada de la URL de la API
  // Prioridad: 1. Variable de entorno, 2. Fallback a producción
  const API_URL = import.meta.env.VITE_API_URL || 'https://extranetmoon.vacanfly.com';

  // Helper para construir URLs de imágenes correctamente (evitando dobles slashes)
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Asegurar que no haya doble slash al concatenar
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
  };

  const [isRegistered] = useState(true);
  const allGuestsRegistered = totalGuests > 0 && registeredGuests === totalGuests;
  const hasResponsibleGuest = guests.some(guest => guest.is_responsible);
  // Validar si la reserva está activa (dentro del rango de fechas en zona horaria de España)
  const isReservationActive = useMemo(() => {
    if (!checkInDate || !checkInTime || !checkOutDate || !checkOutTime) {
      return false;
    }

    if (checkInDate === '?' || checkInTime === '?' || checkOutDate === '?' || checkOutTime === '?') {
      return false;
    }

    try {
      // Obtener fecha/hora actual en zona horaria de España (Europe/Madrid)
      const nowInSpain = new Date().toLocaleString('en-US', {
        timeZone: 'Europe/Madrid'
      });
      const currentDateTime = new Date(nowInSpain);

      // Construir fechas de check-in y check-out
      const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
      const checkOutDateTime = new Date(`${checkOutDate}T${checkOutTime}`);

      // Validar que estamos dentro del rango
      return currentDateTime >= checkInDateTime && currentDateTime <= checkOutDateTime;
    } catch (error) {
      console.error('Error validando rango de fechas:', error);
      return false;
    }
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime]);

  // Calcular si estamos antes o después del rango para mostrar mensaje apropiado
  const reservationTimeStatus = useMemo(() => {
    if (isReservationActive) return 'active';
    if (!checkInDate || !checkInTime || checkInDate === '?' || checkInTime === '?') return 'unknown';

    try {
      const nowInSpain = new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' });
      const currentDateTime = new Date(nowInSpain);
      const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);

      return currentDateTime < checkInDateTime ? 'before' : 'after';
    } catch (error) {
      return 'unknown';
    }
  }, [isReservationActive, checkInDate, checkInTime]);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentType, setIncidentType] = useState<"complaint" | "suggestion">("complaint");
  const [incidentSubject, setIncidentSubject] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showConfirmEntryDialog, setShowConfirmEntryDialog] = useState(false);
  const [showUnlockHistoryDialog, setShowUnlockHistoryDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDoor, setSelectedDoor] = useState<"portal" | "accommodation" | null>(null);
  const [countdown, setCountdown] = useState(4);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Door info state
  const [doorInfo, setDoorInfo] = useState<any>(null);
  const [doorInfoLoaded, setDoorInfoLoaded] = useState(false);
  // console.log(doorInfo);
  // Historial de aperturas
  const [unlockHistory, setUnlockHistory] = useState<any[]>([]);

  // Preferences state
  const [needsCrib, setNeedsCrib] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [doubleBeds, setDoubleBeds] = useState(0);
  const [singleBeds, setSingleBeds] = useState(0);
  const [sofaBeds, setSofaBeds] = useState(0);
  const [bunkBeds, setBunkBeds] = useState(0);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Bed availability state
  const [bedAvailability, setBedAvailability] = useState<{
    double_beds: number;
    single_beds: number;
    sofa_beds: number;
    bunk_beds: number;
    crib: boolean;
    pets: boolean;
  } | null>(null);
  const [loadingBedAvailability, setLoadingBedAvailability] = useState(false);

  // Accommodation info state
  const [accommodationInfo, setAccommodationInfo] = useState<any[]>([]);
  const [accommodationVideos, setAccommodationVideos] = useState<any[]>([]);
  const [accommodationGuide, setAccommodationGuide] = useState<any[]>([]);
  const [accommodationLoaded, setAccommodationLoaded] = useState(false);

  // Agrupar información del alojamiento por categoría
  const groupedAccommodationInfo = () => {
    if (!accommodationInfo || !Array.isArray(accommodationInfo)) return {};

    const grouped: { [key: string]: any[] } = {};
    accommodationInfo.forEach(item => {
      const category = String(item.category);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  };

  // Función helper para obtener el nombre traducido de la categoría de información del alojamiento
  const getAccommodationInfoCategoryName = (categoryId: string): string => {
    const categoryKeys: { [key: string]: string } = {
      '1': 'accommodationInfo.howToArrive',
      '2': 'accommodationInfo.whatIsInAccommodation',
      '3': 'accommodationInfo.howItWorks',
      '4': 'accommodationInfo.howDoI',
      '5': 'accommodationInfo.howToContact',
      '6': 'accommodationInfo.accommodationRules',
      '7': 'accommodationInfo.opening',
    };

    const key = categoryKeys[categoryId];
    return key ? t(key) : '';
  };

  // Cargar preferencias cuando se carga la reserva
  useEffect(() => {
    const loadPreferences = async () => {
      if (!reservationData?.id || preferencesLoaded) return;

      try {
        const response = await preferenceService.get(reservationData.id);
        const preferences = response.data.data;

        if (preferences) {
          setNeedsCrib(preferences.needs_crib || false);
          setHasPets(preferences.pets || false);
          setDoubleBeds(preferences.double_beds || 0);
          setSingleBeds(preferences.single_beds || 0);
          setSofaBeds(preferences.sofa_beds || 0);
          setBunkBeds(preferences.bunk_beds || 0);
          setEstimatedArrivalTime(preferences.estimated_arrival_time || "");
          setAdditionalInfo(preferences.additional_info || "");
        }
        setPreferencesLoaded(true);
      } catch (error) {
        console.error("Error al cargar preferencias:", error);
        // No mostrar error al usuario, simplemente dejar valores por defecto
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, [reservationData?.id, preferencesLoaded]);

  // Cargar disponibilidad de camas del alojamiento
  useEffect(() => {
    const loadBedAvailability = async () => {
      if (!reservationData?.accommodation_id) return;

      try {
        setLoadingBedAvailability(true);
        const response = await accommodationService.getBeds(reservationData.accommodation_id);

        if (response.data.success) {
          setBedAvailability(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando disponibilidad de camas:', error);
        // No mostrar error, simplemente no tendremos límites
      } finally {
        setLoadingBedAvailability(false);
      }
    };

    loadBedAvailability();
  }, [reservationData?.accommodation_id]);

  // Cargar información del alojamiento cuando se carga la reserva
  useEffect(() => {
    const loadAccommodationInfo = async () => {
      if (!reservationData?.accommodation_id || accommodationLoaded) return;

      try {
        const response = await accommodationService.getAll(reservationData.accommodation_id);
        const data = response.data.data;

        if (data) {
          setAccommodationInfo(data.info);
          setAccommodationVideos(data.videos || []);
          setAccommodationGuide(data.guide || []);
        }
        setAccommodationLoaded(true);
      } catch (error) {
        console.error("Error al cargar información del alojamiento:", error);
        // No mostrar error al usuario, los datos hardcodeados se mantendrán
        setAccommodationLoaded(true);
      }
    };

    loadAccommodationInfo();
  }, [reservationData?.accommodation_id, accommodationLoaded]);

  // Cargar sugerencias/quejas de la reserva
  useEffect(() => {
    loadSuggestions();
  }, [reservationData?.id]);

  // Cargar información de cerraduras
  useEffect(() => {
    const loadDoorInfo = async () => {
      if (!reservationData?.id || doorInfoLoaded) return;

      try {
        const response = await doorService.getInfo(reservationData.id);
        if (response.data.success) {
          setDoorInfo(response.data.data);
        }
        setDoorInfoLoaded(true);
      } catch (error) {
        console.error("Error al cargar información de cerraduras:", error);
        setDoorInfoLoaded(true);
      }
    };

    loadDoorInfo();
  }, [reservationData?.id, doorInfoLoaded]);

  // Cargar historial de aperturas
  useEffect(() => {
    loadUnlockHistory();
  }, [reservationData?.id]);

  // Contador para confirmación de apertura
  useEffect(() => {
    if (showConfirmDialog && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmDialog, countdown]);

  // Helper para calcular total de camas solicitadas
  const calculateTotalBeds = () => {
    // Cada cama cuenta como 1 unidad, sin importar si es doble, individual, sofá o {t('dashboard.bunkBed')}
    return doubleBeds + singleBeds + sofaBeds + bunkBeds;
  };

  // Verificar si se está excediendo el número de huéspedes
  const isExceedingGuests = () => {
    const totalBeds = calculateTotalBeds();
    return totalBeds > totalGuests && totalGuests > 0;
  };

  const handleOpenDoorClick = (doorType: "portal" | "accommodation") => {
    setSelectedDoor(doorType);
    setCountdown(4);
    setShowConfirmDialog(true);
  };

  const loadUnlockHistory = async () => {
    if (!reservationData?.id) return;

    try {
      const response = await doorService.getHistory(reservationData.id);
      // console.log(response);
      if (response.data.success) {
        const history = response.data.data.map((entry: any) => ({
          time: entry.time || new Date(entry.unlock_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          date: entry.date || new Date(entry.unlock_time).toISOString().split('T')[0],
          door: entry.door_type === 'portal' ? 'Portal' : 'Alojamiento',
          description: entry.description,
          success: entry.success === 1 || entry.status === 'success'
        }));
        setUnlockHistory(history);
      }
    } catch (error) {
      console.error("Error al cargar historial de aperturas:", error);
    }
  };

  const handleConfirmOpen = async () => {
    if (!selectedDoor || countdown !== 0 || !reservationData?.id) return;

    setUnlockLoading(true);

    try {
      const response = await doorService.unlock({
        reservation_id: reservationData.id,
        guest_id: responsibleGuest?.id || undefined,
        door_type: selectedDoor,
      });

      const success = response.data.success;
      const doorName = selectedDoor === "portal" ? t('dashboard.portal') : "Alojamiento";

      // Recargar historial
      await loadUnlockHistory();

      setShowConfirmDialog(false);

      if (success) {
        toast({
          title: "✅ ¡Puerta abierta!",
          description: `La puerta del ${doorName.toLowerCase()} se ha abierto correctamente`,
          className: "bg-green-500 text-white",
        });

        // Si es la puerta del alojamiento, preguntar si confirma entrada
        if (selectedDoor === "accommodation") {
          setTimeout(() => {
            setShowConfirmEntryDialog(true);
          }, 1000);
        }
      } else {
        toast({
          title: "❌ Error",
          description: response.data.error_message || "No se pudo abrir la puerta. Inténtalo nuevamente.",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleCancelOpen = () => {
    setShowConfirmDialog(false);
    setSelectedDoor(null);
    setCountdown(4);
  };

  const handleConfirmEntry = async () => {
    if (!reservationData?.id) return;

    try {
      await doorService.confirmEntry(reservationData.id);

      toast({
        title: "✅ Entrada confirmada",
        description: "Hemos registrado tu entrada al alojamiento",
        className: "bg-green-500 text-white",
      });

      setShowConfirmEntryDialog(false);
    } catch (error) {
      console.error("Error confirmando entrada:", error);
      setShowConfirmEntryDialog(false);
    }
  };

  const handleSubmitIncident = async () => {
    if (!reservationData?.id) {
      toast({
        title: "Error",
        description: "No se encontró información de la reserva",
        variant: "destructive",
      });
      return;
    }

    // Validar campos
    if (!incidentSubject.trim()) {
      toast({
        title: "Error",
        description: "El asunto es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!incidentDescription.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mapear tipo de frontend a backend
      const type = incidentType === "complaint" ? "Queja" : "Sugerencia";

      await suggestionService.create({
        reservation_id: reservationData.id,
        guest_id: responsibleGuest?.id || undefined,
        subject: incidentSubject,
        description: incidentDescription,
        type: type,
      });

      toast({
        title: "✅ " + (incidentType === "complaint" ? "Queja" : "Sugerencia") + " enviada",
        description: "Tu mensaje ha sido registrado correctamente",
        className: incidentType === "complaint" ? "bg-yellow-500 text-white" : "bg-green-500 text-white",
      });

      // Limpiar formulario y cerrar
      setShowIncidentDialog(false);
      setIncidentSubject("");
      setIncidentDescription("");
      setIncidentType("complaint");

      // Recargar sugerencias
      loadSuggestions();
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    }
  };
  console.log(accommodationGuide);
  const loadSuggestions = async () => {
    if (!reservationData?.id) return;

    try {
      const response = await suggestionService.getByReservation(reservationData.id);
      if (response.data.success) {
        setSuggestions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error cargando sugerencias:", error);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!reservationData?.id) {
      toast({
        title: "Error",
        description: "No se encontró información de la reserva",
        variant: "destructive",
      });
      return;
    }

    const exceedingGuests = isExceedingGuests();

    try {
      await preferenceService.save({
        reservation_id: reservationData.id,
        needs_crib: Boolean(needsCrib),
        pets: Boolean(hasPets),
        double_beds: doubleBeds,
        single_beds: singleBeds,
        sofa_beds: sofaBeds,
        bunk_beds: bunkBeds,
        estimated_arrival_time: estimatedArrivalTime || undefined,
        additional_info: additionalInfo || undefined,
      });

      // Si se están solicitando más camas que huéspedes, notificar
      if (exceedingGuests) {
        toast({
          title: "¡Preferencias actualizadas!",
          description: "Tus preferencias han sido guardadas. El anfitrión será notificado sobre tu solicitud de camas adicionales.",
          variant: "success",
        });
      } else {
        toast({
          title: "¡Preferencias actualizadas!",
          description: "Tus preferencias han sido guardadas correctamente.",
          variant: "success",
        });
      }

      setShowPreferencesDialog(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error al actualizar preferencias",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const Counter = ({
    label,
    value,
    onChange,
    min = 0,
    max = 10,
    disabled = false
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className={disabled ? 'opacity-50' : ''}>{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className={`w-12 text-center font-semibold ${disabled ? 'opacity-50' : ''}`}>{value}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {disabled && (
        <p className="text-xs text-muted-foreground">{t('preferences.notAvailableAccommodation')}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={buildPathWithReservation("/")}>
              <img src={vacanflyLogo} alt="Vacanfly" className="w-20" />
            </Link>

          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowContactDialog(true)}
            >
              <Phone className="w-4 h-4" />
              {t('welcome.contact')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Banner de estado si no está completamente registrado */}
        {!allGuestsRegistered && (
          <div className="mb-6 animate-slide-up">
            <Card className="p-4 border-primary/50 bg-primary/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    {isRegistered
                      ? t('dashboard.missingGuests')
                      : (
                        <Link to={buildPathWithReservation("/register")} className="underline hover:text-primary transition-colors">
                          {t('dashboard.completeToUnlock')}
                        </Link>
                      )}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('dashboard.someFeaturesLimited')}
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => setShowShareDialog(true)}
                  >
                    {t('welcome.share')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Banner si la reserva no está activa (fuera del rango de fechas) */}
        {allGuestsRegistered && !isReservationActive && reservationTimeStatus !== 'unknown' && (
          <div className="mb-6 animate-slide-up">
            <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1 text-yellow-900 dark:text-yellow-100">
                    {reservationTimeStatus === 'before' ? t('dashboard.accessNotYetAvailable') : t('dashboard.accessFinished')}
                  </h3>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    {reservationTimeStatus === 'before'
                      ? `${t('dashboard.accessAvailableFrom')} ${checkInDate} a las ${checkInTime} (${t('dashboard.spainTime')})`
                      : `${t('dashboard.accessFinishedOn')} ${checkOutDate} a las ${checkOutTime} (${t('dashboard.spainTime')})`
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Grid de cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Mi Reserva */}
          <Card
            className={`p-6 shadow-card hover-lift ${!hasResponsibleGuest ? "relative overflow-hidden" : ""
              }`}
          >
            {!hasResponsibleGuest && (
              <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <Link to={buildPathWithReservation("/register")} className="text-sm font-medium underline hover:text-primary transition-colors">
                    {t('dashboard.completeToUnlock')}
                  </Link>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.myReservation')}</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('dashboard.accommodation')}</div>
                  <div className="font-medium">{accommodationName}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('dashboard.reservationId')}</div>
                  <div className="font-medium">{reservationCode}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('dashboard.checkIn')}</div>
                  <div className="font-medium">
                    {checkInDate} {checkInTime}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('dashboard.checkOut')}</div>
                  <div className="font-medium">
                    {checkOutDate} {checkOutTime}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {/* Mostrar mensaje si no hay cerraduras Raixer configuradas */}
                {doorInfoLoaded && doorInfo?.has_locks === false ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <h5 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          {t('dashboard.noRaixerTitle')}
                        </h5>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {t('dashboard.noRaixerMessage')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : doorInfoLoaded && doorInfo?.has_locks === true ? (
                  <>
                    {/* Botones de apertura Raixer */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="gap-2 bg-gradient-primary hover:opacity-90"
                        disabled={!allGuestsRegistered || !isReservationActive}
                        onClick={() => handleOpenDoorClick("portal")}
                      >
                        <Unlock className="w-4 h-4" />
                        {t('dashboard.openPortal')}
                      </Button>
                      <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={!allGuestsRegistered || !isReservationActive}
                        onClick={() => handleOpenDoorClick("accommodation")}
                      >
                        <Unlock className="w-4 h-4" />
                        {t('dashboard.openAccommodation')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    {t('dashboard.loadingAccessInfo')}
                  </div>
                )}

                {/* Ver Historial de Aperturas */}
                <Dialog open={showUnlockHistoryDialog} onOpenChange={setShowUnlockHistoryDialog}>
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setShowUnlockHistoryDialog(true)}
                  >
                    {t('dashboard.unlockHistory')}
                  </Button>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('dashboard.unlockHistory')}</DialogTitle>
                      <DialogDescription>
                        Registro de aperturas desde la app
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {unlockHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No hay aperturas registradas
                        </p>
                      ) : (
                        unlockHistory.map((entry, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg flex items-center justify-between ${entry.success
                              ? 'bg-success/10 border border-success/20'
                              : 'bg-destructive/10 border border-destructive/20'
                              }`}
                          >
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${entry.success ? 'text-success' : 'text-destructive'}`}>
                                {entry.description || entry.door}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {entry.date} a las {entry.time}
                              </p>
                            </div>
                            <span className={`text-2xl ml-3 ${entry.success ? 'text-success' : 'text-destructive'}`}>
                              {entry.success ? '✓' : '✗'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Descargar Contrato */}
                {reservationData?.contract_path && (
                  <a
                    href={getImageUrl(reservationData.contract_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button
                      variant="outline"
                      className="w-full text-xs gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {t('dashboard.downloadContract')}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Card 0: Gestión de Huéspedes */}
          <Card className="p-6 shadow-card hover-lift">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.guestManagement')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('dashboard.registeredGuests')}</span>
                  <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {registeredGuests} / {totalGuests}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {/* Huéspedes Registrados */}
                  {guests.map((guest, index) => (
                    <div
                      key={guest.id || index}
                      className={`flex items-center justify-between p-2 rounded-lg border ${guest.is_responsible
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500/50'
                        : 'bg-muted/40 border-border/50'
                        }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${guest.is_responsible ? 'bg-blue-500/10' : 'bg-green-500/10'
                          }`}>
                          <div className={`w-2 h-2 rounded-full ${guest.is_responsible ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                        </div>
                        <div className="truncate">
                          <p className={`font-medium text-sm truncate ${guest.is_responsible ? 'text-blue-700 dark:text-blue-300' : ''
                            }`}>
                            {guest.first_name} {guest.last_name}
                          </p>
                          {!!guest.is_responsible && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold">
                              {t('preferences.responsible')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Slots Pendientes */}
                  {Array.from({ length: Math.max(0, totalGuests - guests.length) }).map((_, i) => (
                    <Link
                      key={`pending-${i}`}
                      to={buildPathWithReservation("/register")}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">?</span>
                          </div>
                          <p className="text-sm text-muted-foreground italic">
                            {t('dashboard.pendingGuest')} {guests.length + i + 1}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() => setShowShareDialog(true)}
                >
                  <LinkIcon className="w-4 h-4" />
                  {t('dashboard.copyLink')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Card 2: Preferencias de Estancia */}
          <Card
            className={`p-6 shadow-card hover-lift ${!hasResponsibleGuest ? "relative overflow-hidden" : ""
              }`}
          >
            {!hasResponsibleGuest && (
              <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <Link to={buildPathWithReservation("/register")} className="text-sm font-medium underline hover:text-primary transition-colors">
                    {t('dashboard.completeToUnlock')}
                  </Link>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.preferences')}</h2>
              </div>
              <div className="space-y-3">
                {estimatedArrivalTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{t('dashboard.arrival')}: {estimatedArrivalTime}</span>
                  </div>
                )}
                {(doubleBeds > 0 || singleBeds > 0 || sofaBeds > 0) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bed className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {doubleBeds > 0 && `${doubleBeds} ${doubleBeds === 1 ? t('dashboard.doubleBed') : t('dashboard.doubleBeds')}`}
                      {doubleBeds > 0 && (singleBeds > 0 || sofaBeds > 0) && ', '}
                      {singleBeds > 0 && `${singleBeds} ${singleBeds === 1 ? t('dashboard.singleBed') : t('dashboard.singleBeds')}`}
                      {singleBeds > 0 && sofaBeds > 0 && ', '}
                      {sofaBeds > 0 && `${sofaBeds} sofá${sofaBeds === 1 ? '' : 's'} cama`}
                    </span>
                  </div>
                )}
                {needsCrib && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🛏️</span>
                    <span>{t('dashboard.cribRequested')}</span>
                  </div>
                )}
                {hasPets && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🐾</span>
                    <span>{t('dashboard.petsRequested') || 'Mascotas incluidas'}</span>
                  </div>
                )}
                {additionalInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{additionalInfo}</span>
                  </div>
                )}
                {!estimatedArrivalTime && !doubleBeds && !singleBeds && !sofaBeds && !needsCrib && !hasPets && !additionalInfo && (
                  <p className="text-sm text-muted-foreground italic">
                    No hay preferencias configuradas
                  </p>
                )}
              </div>
              <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!hasResponsibleGuest}
                  onClick={() => setShowPreferencesDialog(true)}
                >
                  {t('dashboard.editPreferences')}
                </Button>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('preferences.updateTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('preferences.updateSubtitle')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Hora de llegada */}
                    <div className="space-y-2">
                      <Label htmlFor="arrivalTime">{t('preferences.arrivalTime')}</Label>
                      <Input
                        id="arrivalTime"
                        type="time"
                        value={estimatedArrivalTime}
                        onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('preferences.arrivalHelp')}
                      </p>
                    </div>

                    {/* Necesita cuna */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                      <Checkbox
                        id="needsCrib"
                        checked={needsCrib}
                        onCheckedChange={(checked) => setNeedsCrib(checked === true)}
                        disabled={bedAvailability !== null && !bedAvailability.crib}
                      />
                      <Label htmlFor="needsCrib" className={`cursor-pointer flex items-center gap-2 ${bedAvailability !== null && !bedAvailability.crib ? 'opacity-50' : ''}`}>
                        {t('preferences.needsCrib')}
                        {bedAvailability !== null && bedAvailability.crib && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {t('preferences.freeOfCharge')}
                          </span>
                        )}
                        {bedAvailability !== null && !bedAvailability.crib && <span className="text-xs text-muted-foreground">({t('preferences.notAvailable')})</span>}
                      </Label>
                    </div>

                    {/* Tiene mascotas */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                      <Checkbox
                        id="hasPets"
                        checked={hasPets}
                        onCheckedChange={(checked) => setHasPets(checked === true)}
                        disabled={bedAvailability !== null && !bedAvailability.pets}
                      />
                      <Label htmlFor="hasPets" className={`cursor-pointer flex items-center gap-2 ${bedAvailability !== null && !bedAvailability.pets ? 'opacity-50' : ''}`}>
                        {t('preferences.hasPets') || 'Viajo con mascotas'}
                        {bedAvailability !== null && bedAvailability.pets && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {t('preferences.freeOfCharge')}
                          </span>
                        )}
                        {bedAvailability !== null && !bedAvailability.pets && <span className="text-xs text-muted-foreground">({t('preferences.notAvailable') || 'No permitido'})</span>}
                      </Label>
                    </div>

                    {/* Configuración de camas */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">{t('preferences.bedConfiguration')}</h4>
                      {loadingBedAvailability ? (
                        <p className="text-sm text-muted-foreground">{t('preferences.loadingAvailability')}</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <Counter
                              label={`${t('preferences.doubleBeds')} ${bedAvailability && bedAvailability.double_beds > 0 ? `(${t('preferences.max')}: ${bedAvailability.double_beds})` : ''}`}
                              value={doubleBeds}
                              onChange={setDoubleBeds}
                              max={bedAvailability?.double_beds || 5}
                              disabled={bedAvailability !== null && bedAvailability.double_beds === 0}
                            />
                            <Counter
                              label={`${t('preferences.singleBeds')} ${bedAvailability && bedAvailability.single_beds > 0 ? `(${t('preferences.max')}: ${bedAvailability.single_beds})` : ''}`}
                              value={singleBeds}
                              onChange={setSingleBeds}
                              max={bedAvailability?.single_beds || 10}
                              disabled={bedAvailability !== null && bedAvailability.single_beds === 0}
                            />
                            <Counter
                              label={`${t('preferences.sofaBeds')} ${bedAvailability && bedAvailability.sofa_beds > 0 ? `(${t('preferences.max')}: ${bedAvailability.sofa_beds})` : ''}`}
                              value={sofaBeds}
                              onChange={setSofaBeds}
                              max={bedAvailability?.sofa_beds || 3}
                              disabled={bedAvailability !== null && bedAvailability.sofa_beds === 0}
                            />
                            <Counter
                              label={`${t('preferences.bunkBeds')} ${bedAvailability && bedAvailability.bunk_beds > 0 ? `(${t('preferences.max')}: ${bedAvailability.bunk_beds})` : ''}`}
                              value={bunkBeds}
                              onChange={setBunkBeds}
                              max={bedAvailability?.bunk_beds || 5}
                              disabled={bedAvailability !== null && bedAvailability.bunk_beds === 0}
                            />
                          </div>

                          {/* Alerta de exceso de camas */}
                          {isExceedingGuests() && (
                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-500/50 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                    {t('preferences.extraBedsTitle')}
                                  </h5>
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    {t('preferences.bedsRequestMessage1')} <strong>{calculateTotalBeds()} {t('preferences.beds')}</strong> {t('preferences.bedsRequestMessage2')} <strong>{totalGuests} {totalGuests !== 1 ? t('preferences.guests') : t('preferences.guest')}</strong>.
                                    {' '}{t('preferences.bedsRequestMessage3')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo">{t('preferences.additionalInfo')}</Label>
                      <Textarea
                        id="additionalInfo"
                        placeholder={t('preferences.additionalInfoPlaceholder')}
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {additionalInfo.length}/500 {t('preferences.characters')}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPreferencesDialog(false)}>
                      {t('dashboard.cancel')}
                    </Button>
                    <Button onClick={handleUpdatePreferences} className="bg-gradient-primary hover:opacity-90">
                      {t('dashboard.saveChanges')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Card 3: Tu Anfitrión */}
          <Card className="p-6 shadow-card hover-lift">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.yourHost')}</h2>
              </div>
              <div className="flex items-center gap-3">
                {hostPhotoUrl ? (
                  <img
                    src={getImageUrl(hostPhotoUrl)}
                    alt={hostName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-secondary"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-secondary flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <p className="font-semibold">{hostName}</p>
                  <p className="text-sm text-muted-foreground">{t('contact.available')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => window.location.href = `tel:${hostPhone}`}
                >
                  <Phone className="w-4 h-4" />
                  {hostPhone}
                </Button>
                {/* <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => window.location.href = `mailto:${hostEmail}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {hostEmail}
                </Button> */}
              </div>
            </div>
          </Card>

          {/* Card 5: Video de Bienvenida */}
          <Card className="p-6 shadow-card hover-lift">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <Video className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.welcomeVideo')}</h2>
              </div>
              {accommodationVideos.length > 0 ? (
                <div className="space-y-4">
                  {accommodationVideos.map((video) => (
                    <div key={video.id} className="space-y-2">
                      {video.title && (
                        <h3 className="text-sm font-semibold">{video.title}</h3>
                      )}
                      {video.description && video.description !== video.url && (
                        <p className="text-xs text-muted-foreground">{video.description}</p>
                      )}
                      <LiteYouTube
                        videoUrl={video.url || video.video_url || ''}
                        title={video.title || 'Video de bienvenida'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cargando videos...</p>
              )}
            </div>
          </Card>

          {/* Card 4: Información del Alojamiento */}
          <Card className="p-6 shadow-card hover-lift md:col-span-2 lg:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.accommodationInfo')}</h2>
              </div>
              {accommodationInfo && accommodationInfo.length > 0 ? (
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  onValueChange={(value) => {
                    if (value) {
                      // Timeout to allow the accordion to expand before scrolling
                      setTimeout(() => {
                        const element = document.getElementById(`accommodation-item-${value}`);
                        if (element) {
                          // Scroll to the top of the element
                          const elementTop = element.getBoundingClientRect().top + window.scrollY;
                          // Use a relative offset based on viewport height (9% of screen height)
                          // This ensures proper positioning across different screen sizes
                          const offset = window.innerHeight * 0.09;
                          window.scrollTo({
                            top: elementTop - offset,
                            behavior: 'smooth'
                          });
                        }
                      }, 200);
                    }
                  }}
                >
                  {Object.entries(groupedAccommodationInfo()).map(([categoryId, items]) => {
                    // Solo mostrar categorías del 1 al 7 (8 es para videos)
                    const categoryName = getAccommodationInfoCategoryName(categoryId);
                    if (categoryId === '8' || !categoryName) return null;

                    return (
                      <AccordionItem
                        key={categoryId}
                        value={categoryId}
                        id={`accommodation-item-${categoryId}`}
                      >
                        <AccordionTrigger className="text-sm">
                          {categoryName}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 text-sm prose prose-sm max-w-none">
                          {items.map((item: any) => (
                            <div key={item.id} className="p-2 bg-muted/50 rounded-lg space-y-1">
                              {item.name && (
                                <h4 className="font-semibold text-sm">{item.name}</h4>
                              )}
                              {item.description && (
                                <div
                                  className="[&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold"
                                  dangerouslySetInnerHTML={{ __html: item.description }}
                                />
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">Cargando información...</p>
              )}
            </div>
          </Card>



          {/* Card Nueva: Servicios Premium (Bloqueada) }
          <Card className="p-6 shadow-card hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Funcionalidad en Desarrollo</p>
                <p className="text-xs text-muted-foreground mt-1">Próximamente disponible</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Servicios Premium</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Servicio de limpieza extra</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Late check-out disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Desayuno en el alojamiento</span>
                </div>
              </div>
            </div>
          </Card>*/}

          {/* Card 6: Guía Local */}
          <Card className="p-6 shadow-card hover-lift">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.localGuide')}</h2>
              </div>
              {accommodationGuide.length > 0 ? (
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  onValueChange={(value) => {
                    if (value) {
                      // Timeout to allow the accordion to expand before scrolling
                      setTimeout(() => {
                        const element = document.getElementById(`guide-item-${value}`);
                        if (element) {
                          // Scroll to the top of the element
                          const elementTop = element.getBoundingClientRect().top + window.scrollY;
                          // Use a relative offset based on viewport height (5% of screen height)
                          // This ensures proper positioning across different screen sizes
                          const offset = window.innerHeight * 0.09;
                          window.scrollTo({
                            top: elementTop - offset,
                            behavior: 'smooth'
                          });
                        }
                      }, 200);
                    }
                  }}
                >
                  {accommodationGuide.map((category) => (
                    <AccordionItem
                      key={category.id}
                      value={category.id}
                      id={`guide-item-${category.id}`}
                    >
                      <AccordionTrigger className="text-sm text-left [&[data-state=open]>svg]:rotate-180 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
                        <div className="flex items-center gap-2 text-left w-full">
                          <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span
                            className="text-left"
                            dangerouslySetInnerHTML={{ __html: translateCategory(category.title) }}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 local-guide-content">
                          {/* Items directos (si los hay) */}
                          {category.items && category.items.length > 0 && (
                            <div className="space-y-2">
                              {category.items.map((item: any) => (
                                <div key={item.id} className="p-2 bg-muted/50 rounded-lg text-left">
                                  {item.name && (
                                    <div
                                      className="font-bold text-sm mb-1"
                                      dangerouslySetInnerHTML={{ __html: item.name }}
                                    />
                                  )}
                                  {item.description && (
                                    <div
                                      className="text-xs text-muted-foreground prose prose-xs max-w-none [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold text-left [&_*]:!text-left"
                                      dangerouslySetInnerHTML={{ __html: item.description }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Subcategorías (Jerarquía) */}
                          {category.subcategories && category.subcategories.map((sub: any) => {
                            // Detectar si es la subcategoría de "Recomendaciones"
                            // Limpiamos etiquetas HTML primero para comparar el texto
                            const cleanTitle = sub.title ? sub.title.replace(/<\/?[^>]+(>|$)/g, "").trim() : "";
                            const isRecommendations = cleanTitle.toLowerCase().includes('recomendaciones') ||
                              cleanTitle.toLowerCase().includes('recommendations');

                            return (
                              <div key={sub.id} className="space-y-2 pt-2 first:pt-0">
                                <h4
                                  className={`font-semibold text-sm border-b pb-1 mb-2 rounded px-2 py-1 ${isRecommendations ? 'bg-yellow-100/50 text-primary' : 'text-primary/80'}`}
                                  dangerouslySetInnerHTML={{ __html: translateCategory(sub.title) }}
                                />
                                {sub.items && sub.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className={`p-2 rounded-lg text-left ${isRecommendations ? 'bg-yellow-100/50' : 'bg-muted/50'}`}
                                  >
                                    {item.name && (
                                      <div
                                        className={`font-bold text-sm mb-1 ${isRecommendations ? 'text-primary' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: item.name }}
                                      />
                                    )}
                                    {item.description && (
                                      <div
                                        className="text-xs text-muted-foreground prose prose-xs max-w-none [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold text-left [&_*]:!text-left"
                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                      />
                                    )}
                                  </div>
                                ))}
                                {sub.description && (
                                  <div
                                    className="text-xs text-muted-foreground prose prose-xs max-w-none mt-2 mb-3 text-left [&_*]:!text-left italic bg-muted/20 p-2 rounded"
                                    dangerouslySetInnerHTML={{ __html: sub.description }}
                                  />
                                )}
                              </div>
                            )
                          })}

                          {/* Mensaje vacio si no hay nada */}
                          {(!category.items?.length && !category.subcategories?.length) && (
                            <p className="text-xs text-muted-foreground">No hay información disponible</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">Cargando guía local...</p>
              )}
            </div>
          </Card>

          {/* Card 7: Atención al Cliente */}
          <Card className="p-6 shadow-card hover-lift md:col-span-2 lg:col-span-3">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-xl font-bold">{t('dashboard.customerSupport')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Botón 1: Contacto - Abre el modal del anfitrión */}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowContactDialog(true)}
                >
                  <User className="w-4 h-4" />
                  Contacto
                </Button>

                {/* Botón 2: Sugerencias o Quejas */}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowIncidentDialog(true)}
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('dashboard.suggestionsComplaints')}
                </Button>

                {/* Botón 3: Enlace a vacanfly.com */}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open('https://vacanfly.com', '_blank')}
                >
                  <Home className="w-4 h-4" />
                  {t('dashboard.visitVacanfly')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Dialog para sugerencias o quejas */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.suggestionsComplaints')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.yourOpinionHelps')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="incident-type-main">{t('dashboard.type')}</Label>
              <Select value={incidentType} onValueChange={(value) => setIncidentType(value as "complaint" | "suggestion")}>
                <SelectTrigger id="incident-type-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">{t('dashboard.complaint')}</SelectItem>
                  <SelectItem value="suggestion">{t('dashboard.suggestion')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="incident-subject-main">{t('dashboard.incidentSubject')}</Label>
              <input
                id="incident-subject-main"
                type="text"
                placeholder={t('dashboard.subjectPlaceholder')}
                value={incidentSubject}
                onChange={(e) => setIncidentSubject(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <Label htmlFor="incident-description-main">{t('dashboard.incidentDescription')}</Label>
              <Textarea
                id="incident-description-main"
                placeholder={t('dashboard.descriptionPlaceholder')}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          {/* Historial de sugerencias y quejas */}
          {suggestions.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">📋 {t('dashboard.messageHistory')}</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestions.map((item: any) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${item.type === 'Queja'
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                      : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.type === 'Queja'
                            ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                            : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                            }`}>
                            {item.type === 'Queja' ? '⚠️ Queja' : '💡 Sugerencia'}
                          </span>
                        </div>
                        <p className="font-semibold text-sm">{item.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncidentDialog(false)}>
              {t('dashboard.cancel')}
            </Button>
            <Button onClick={handleSubmitIncident} className="bg-gradient-primary hover:opacity-90">
              {t('dashboard.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de apertura */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Confirmar apertura de puerta</DialogTitle>
            <DialogDescription className="sr-only">
              Confirma que deseas realizar la apertura de la puerta seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            {/* Icono de interrogación */}
            <div className="w-24 h-24 rounded-full border-4 border-orange-500 flex items-center justify-center">
              <span className="text-6xl font-bold text-orange-500">?</span>
            </div>

            {/* Mensaje */}
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground">
                {selectedDoor === "portal" ? "🏢 ¡Perfecto! Vamos a abrir el portal" : "🏠 ¡Perfecto! Vamos a abrir el alojamiento"}
              </p>
              {doorInfo && (
                <div
                  className="text-sm text-muted-foreground mt-2 text-justify"
                  dangerouslySetInnerHTML={{
                    __html: selectedDoor === "portal" ? doorInfo.portal_info : doorInfo.casa_info
                  }}
                />
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 w-full">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancelOpen}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleConfirmOpen}
                disabled={countdown > 0 || unlockLoading}
              >
                {unlockLoading ? "Abriendo..." : (countdown > 0 ? `Confirmar en (${countdown})` : "Confirmar")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de entrada al alojamiento */}
      <Dialog open={showConfirmEntryDialog} onOpenChange={setShowConfirmEntryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Confirmar entrada al alojamiento</DialogTitle>
            <DialogDescription className="sr-only">
              Confirma que has podido entrar correctamente al alojamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            {/* Icono de casa */}
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
              <Home className="w-12 h-12 text-green-500" />
            </div>

            {/* Mensaje */}
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground">
                ✅ ¡Puerta abierta!
              </p>
              <p className="text-sm text-muted-foreground">
                ¿Ya has ingresado al alojamiento?
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmEntryDialog(false)}
              >
                Aún no
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={handleConfirmEntry}
                disabled={unlockLoading}
              >
                Sí, confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={(open) => {
        setShowContactDialog(open);
        if (!open) setShowSuperHost(false);
      }}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('contact.title')}</DialogTitle>
            <DialogDescription>
              {t('contact.available')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Primary Host */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {hostPhotoUrl ? (
                  <img
                    src={getImageUrl(hostPhotoUrl)}
                    alt={hostName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">{hostName}</p>
                  <p className="text-xs text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                    {t('contact.available')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-border hover:bg-muted/50"
                  onClick={() => window.location.href = `tel:${hostPhone}`}
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-medium">{hostPhone}</span>
                </Button>
                {/* <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-border hover:bg-muted/50"
                  onClick={() => window.location.href = `mailto:${hostEmail}`}
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate">{hostEmail}</span>
                </Button> */}
              </div>
            </div>

            {/* Super Host Accordion Trigger */}
            {superHostName && (
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => setShowSuperHost(!showSuperHost)}
                  className="w-full flex items-center justify-between py-2 text-sm text-primary font-medium hover:underline group"
                >
                  <span className="text-left leading-tight">{t('contact.problemQuestion')}</span>
                  {showSuperHost ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                </button>

                {/* Collapsible Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSuperHost ? 'max-height-[500px] opacity-100 mt-4' : 'max-height-0 opacity-0'}`}>
                  <div className="bg-muted/40 rounded-2xl p-4 space-y-4 border border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {t('contact.superHostMessage').replace('{hostName}', hostName)}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      {superHostPhotoUrl ? (
                        <img
                          src={getImageUrl(superHostPhotoUrl)}
                          alt={superHostName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl shadow-sm">
                          👤
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm">{superHostName}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          {t('contact.superHostTitle')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {superHostPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-3 h-10 bg-background/50 border-border/40 hover:bg-background"
                          onClick={() => window.location.href = `tel:${superHostPhone}`}
                        >
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{superHostPhone}</span>
                        </Button>
                      )}
                      {/* {superHostEmail && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-3 h-10 bg-background/50 border-border/40 hover:bg-background"
                          onClick={() => window.location.href = `mailto:${superHostEmail}`}
                        >
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium truncate">{superHostEmail}</span>
                        </Button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} />
    </div>
  );
};

export default Dashboard;
