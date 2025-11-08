import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Plus, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const RegisterPreferences = () => {
  const navigate = useNavigate();
  const { buildPathWithReservation } = useReservationParams();
  const { setPreferenceData, isGuestDataComplete } = useRegistrationFlow();

  const [needsCrib, setNeedsCrib] = useState(false);
  const [doubleBeds, setDoubleBeds] = useState(0);
  const [singleBeds, setSingleBeds] = useState(0);
  const [sofaBeds, setSofaBeds] = useState(0);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [allergies, setAllergies] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

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
    max = 10 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
    min?: number; 
    max?: number;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="w-16 text-center text-xl font-semibold">{value}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
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
                <Select value={estimatedArrivalTime} onValueChange={setEstimatedArrivalTime}>
                  <SelectTrigger id="arrivalTime" className="h-12">
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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
                />
                <Label htmlFor="needsCrib" className="cursor-pointer">
                  Necesita Cuna
                </Label>
              </div>

              {/* Configuración de camas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración de Camas</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <Counter
                    label="Camas Dobles"
                    value={doubleBeds}
                    onChange={setDoubleBeds}
                    max={5}
                  />
                  <Counter
                    label="Camas Individuales"
                    value={singleBeds}
                    onChange={setSingleBeds}
                    max={10}
                  />
                  <Counter
                    label="Sofá Cama"
                    value={sofaBeds}
                    onChange={setSofaBeds}
                    max={3}
                  />
                </div>
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
