import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Plus, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import { useReservation } from "@/hooks/useReservation";
import { accommodationService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const RegisterPreferences = () => {
  const navigate = useNavigate();
  const { buildPathWithReservation } = useReservationParams();
  const { setPreferenceData, preferenceData, isGuestDataComplete } = useRegistrationFlow();
  const { reservationData } = useReservation();

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
          title: "Advertencia",
          description: "No se pudo cargar la disponibilidad de camas. Podrás continuar pero puede haber limitaciones.",
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

  // Esta página solo debe mostrarse al responsable de la reserva
  // En producción, verificar si el usuario actual es el responsable

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar que los datos del huésped estén completos
    if (!isGuestDataComplete) {
      navigate(buildPathWithReservation("/register"));
      return;
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
              Paso <span className="text-foreground">2</span> de 3
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Preferencias de Estancia</h1>
            <p className="text-muted-foreground">
              Como responsable de la reserva, personaliza los detalles del alojamiento
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              👤 Responsable de la Reserva
            </div>
          </div>

          <Card className="p-6 md:p-8 shadow-elegant">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hora de llegada */}
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">
                  Hora de Llegada Estimada
                </Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={estimatedArrivalTime}
                  onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                  className="h-12 text-base"
                  placeholder="15:00"
                />
                <p className="text-sm text-muted-foreground">
                  Nos ayuda a preparar tu alojamiento
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
                  Necesita Cuna {bedAvailability !== null && !bedAvailability.crib && <span className="text-xs text-muted-foreground">(No disponible)</span>}
                </Label>
              </div>

              {/* Configuración de camas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración de Camas</h3>
                {loadingAvailability ? (
                  <p className="text-sm text-muted-foreground">Cargando disponibilidad...</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Counter
                      label={`Camas Dobles ${bedAvailability && bedAvailability.double_beds > 0 ? `(Máx: ${bedAvailability.double_beds})` : ''}`}
                      value={doubleBeds}
                      onChange={setDoubleBeds}
                      max={bedAvailability?.double_beds || 5}
                      disabled={bedAvailability !== null && bedAvailability.double_beds === 0}
                    />
                    <Counter
                      label={`Camas Individuales ${bedAvailability && bedAvailability.single_beds > 0 ? `(Máx: ${bedAvailability.single_beds})` : ''}`}
                      value={singleBeds}
                      onChange={setSingleBeds}
                      max={bedAvailability?.single_beds || 10}
                      disabled={bedAvailability !== null && bedAvailability.single_beds === 0}
                    />
                    <Counter
                      label={`Sofá Cama ${bedAvailability && bedAvailability.sofa_beds > 0 ? `(Máx: ${bedAvailability.sofa_beds})` : ''}`}
                      value={sofaBeds}
                      onChange={setSofaBeds}
                      max={bedAvailability?.sofa_beds || 3}
                      disabled={bedAvailability !== null && bedAvailability.sofa_beds === 0}
                    />
                    <Counter
                      label={`Literas ${bedAvailability && bedAvailability.bunk_beds > 0 ? `(Máx: ${bedAvailability.bunk_beds})` : ''}`}
                      value={bunkBeds}
                      onChange={setBunkBeds}
                      max={bedAvailability?.bunk_beds || 5}
                      disabled={bedAvailability !== null && bedAvailability.bunk_beds === 0}
                    />
                  </div>
                )}
              </div>

              {/* Información adicional */}
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">
                  Información Adicional (Opcional)
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Alergias, peticiones especiales, comentarios..."
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {additionalInfo.length}/500 caracteres
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
                    Atrás
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Info de guardado automático */}
          <div className="text-center text-sm text-muted-foreground">
            💾 Tu progreso se guarda automáticamente
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPreferences;
