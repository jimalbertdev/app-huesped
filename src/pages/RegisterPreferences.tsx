import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Plus, Minus, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import { useReservation } from "@/hooks/useReservation";
import { accommodationService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import FloatingActionBar from "@/components/FloatingActionBar";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const RegisterPreferences = () => {
  const navigate = useNavigate();
  const { buildPathWithReservation } = useReservationParams();
  const { setPreferenceData, preferenceData, isGuestDataComplete } = useRegistrationFlow();
  const { reservationData } = useReservation();
  const { t } = useLanguage();

  const [needsCrib, setNeedsCrib] = useState(false);
  const [doubleBeds, setDoubleBeds] = useState(0);
  const [singleBeds, setSingleBeds] = useState(0);
  const [sofaBeds, setSofaBeds] = useState(0);
  const [bunkBeds, setBunkBeds] = useState(0);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [allergies, setAllergies] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Estado para disponibilidad de camas
  const [bedAvailability, setBedAvailability] = useState<{
    double_beds: number;
    single_beds: number;
    sofa_beds: number;
    bunk_beds: number;
    crib: boolean;
  } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Cargar disponibilidad de camas del alojamiento
  useEffect(() => {
    const loadBedAvailability = async () => {
      if (!reservationData?.accommodation_id) return;

      try {
        setLoadingAvailability(true);
        const response = await accommodationService.getBeds(reservationData.accommodation_id);

        if (response.data.success) {
          setBedAvailability(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando disponibilidad de camas:', error);
        toast({
          title: t('preferences.warning'),
          description: t('preferences.bedLoadError'),
          variant: "destructive",
        });
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadBedAvailability();
  }, [reservationData?.accommodation_id]);

  // Restaurar datos de preferencias desde el contexto (al volver atrás)
  useEffect(() => {
    if (preferenceData) {
      setNeedsCrib(preferenceData.needs_crib);
      setDoubleBeds(preferenceData.double_beds);
      setSingleBeds(preferenceData.single_beds);
      setSofaBeds(preferenceData.sofa_beds);
      setBunkBeds(preferenceData.bunk_beds);
      setEstimatedArrivalTime(preferenceData.estimated_arrival_time || "");
      setAdditionalInfo(preferenceData.additional_info || "");
      setAllergies(preferenceData.allergies || "");
      setSpecialRequests(preferenceData.special_requests || "");
    }
  }, [preferenceData]);

  // Redirección automática al dashboard si todos los huéspedes están registrados
  const totalGuests = reservationData?.total_guests || 0;
  const registeredGuests = reservationData?.registered_guests || 0;
  const allGuestsRegistered = totalGuests > 0 && registeredGuests >= totalGuests;

  useEffect(() => {
    if (allGuestsRegistered && totalGuests > 0) {
      navigate(buildPathWithReservation('/dashboard'));
    }
  }, [allGuestsRegistered, totalGuests, navigate, buildPathWithReservation]);

  // Esta página solo debe mostrarse al responsable de la reserva
  // En producción, verificar si el usuario actual es el responsable

  // Helper para calcular total de camas solicitadas
  const calculateTotalBeds = () => {
    // Cada cama cuenta como 1 unidad, sin importar si es doble, individual, sofá o litera
    return doubleBeds + singleBeds + sofaBeds + bunkBeds;
  };

  // Verificar si se está excediendo el número de huéspedes
  const isExceedingGuests = () => {
    const totalBeds = calculateTotalBeds();
    const totalGuests = reservationData?.total_guests || 0;
    return totalBeds > totalGuests && totalGuests > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar que los datos del huésped estén completos
    if (!isGuestDataComplete) {
      navigate(buildPathWithReservation("/register"));
      return;
    }

    // Mostrar alerta si se excede el número de huéspedes
    if (isExceedingGuests()) {
      toast({
        title: "Solicitud de camas adicionales",
        description: "El anfitrión será notificado sobre tu solicitud de camas adicionales.",
        variant: "default",
      });
    }

    // GUARDAR TEMPORALMENTE EN CONTEXTO (NO en DB todavía)
    setPreferenceData({
      needs_crib: needsCrib,
      double_beds: doubleBeds,
      single_beds: singleBeds,
      sofa_beds: sofaBeds,
      bunk_beds: bunkBeds,
      estimated_arrival_time: estimatedArrivalTime || undefined,
      additional_info: additionalInfo || undefined,
      allergies: allergies || undefined,
      special_requests: specialRequests || undefined,
    });

    // Continuar a términos y condiciones
    navigate(buildPathWithReservation("/register/terms"));
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
          className="h-12 w-12"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className={`w-16 text-center text-xl font-semibold ${disabled ? 'opacity-50' : ''}`}>{value}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {disabled && (
        <p className="text-xs text-muted-foreground">No disponible en este alojamiento</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header con progreso */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={vacanflyLogo} alt="Vacanfly" className="w-20" />

          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                ✓
              </div>
              <div className="w-12 h-1 bg-primary" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div className="w-12 h-1 bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">
                3
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t('preferences.step')} <span className="text-foreground">2</span> {t('preferences.of')} 3
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{t('preferences.title')}</h1>
            <p className="text-muted-foreground">
              {t('preferences.subtitle')}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              👤 {t('preferences.responsible')}
            </div>
          </div>

          <Card className="p-6 md:p-8 shadow-elegant">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hora de llegada */}
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">
                  {t('preferences.arrivalTime')}
                </Label>
                <Select
                  value={estimatedArrivalTime}
                  onValueChange={setEstimatedArrivalTime}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="--:--" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const hour = Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t('preferences.arrivalHelp')}
                </p>
              </div>

              {/* Necesita cuna */}
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
                <Checkbox
                  id="needsCrib"
                  checked={needsCrib}
                  onCheckedChange={(checked) => setNeedsCrib(checked as boolean)}
                  disabled={bedAvailability !== null && !bedAvailability.crib}
                />
                <Label htmlFor="needsCrib" className={`cursor-pointer ${bedAvailability !== null && !bedAvailability.crib ? 'opacity-50' : ''}`}>
                  {t('preferences.needsCrib')} {bedAvailability !== null && !bedAvailability.crib && <span className="text-xs text-muted-foreground">({t('preferences.notAvailable')})</span>}
                </Label>
              </div>

              {/* Configuración de camas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('preferences.bedConfiguration')}</h3>
                {loadingAvailability ? (
                  <p className="text-sm text-muted-foreground">{t('preferences.loadingAvailability')}</p>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
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
                              {t('preferences.additionalBedsRequest')}
                            </h5>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              {t('preferences.bedsRequestMessage1')} <strong>{calculateTotalBeds()} {t('preferences.beds')}</strong> {t('preferences.bedsRequestMessage2')} <strong>{reservationData?.total_guests || 0} {t('preferences.guest')}{(reservationData?.total_guests || 0) !== 1 ? t('preferences.guestPlural') : ''}</strong>. {t('preferences.bedsRequestMessage3')}
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
                <Label htmlFor="additionalInfo">
                  {t('preferences.additionalInfo')}
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder={t('preferences.additionalInfoPlaceholder')}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {additionalInfo.length}/500 {t('preferences.characters')}
                </p>
              </div>

              {/* Navegación */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to={buildPathWithReservation("/register")} className="sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('preferences.back')}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                >
                  {t('preferences.continue')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Info de guardado automático */}
          <div className="text-center text-sm text-muted-foreground">
            {t('preferences.autoSave')}
          </div>
        </div>
      </main>

      {/* Barra flotante con idioma y contacto */}
      <FloatingActionBar />
    </div>
  );
};

export default RegisterPreferences;
