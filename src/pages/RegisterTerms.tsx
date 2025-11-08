import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useReservationParams } from "@/hooks/useReservationParams";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const RegisterTerms = () => {
  const { buildPathWithReservation } = useReservationParams();
  const [accepted, setAccepted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSigning(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'hsl(var(--foreground))';

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSigning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsSigning(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const isFormValid = accepted && hasSignature;

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
              <div className="w-12 h-1 bg-success" />
              <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-semibold">
                ✓
              </div>
              <div className="w-12 h-1 bg-primary" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Paso <span className="text-foreground">3</span> de 3
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">📄 Contrato de Hospedaje</h1>
            <p className="text-muted-foreground">
              Lee y acepta los términos para completar tu registro
            </p>
          </div>

          <Card className="p-6 md:p-8 shadow-elegant">
            <div className="space-y-6">
              {/* Contrato scrollable */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Términos y Condiciones</h3>
                <ScrollArea className="h-[300px] w-full rounded-lg border p-4">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Resumen de Puntos Clave</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Horario de check-in: 15:00 - 20:00</li>
                        <li>Horario de check-out: hasta las 11:00</li>
                        <li>Prohibido fumar en el interior</li>
                        <li>No se permiten mascotas</li>
                        <li>Capacidad máxima: según reserva</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">1. Normas del Alojamiento</h4>
                      <p className="text-muted-foreground">
                        El huésped se compromete a mantener el alojamiento en buen estado y hacer un uso responsable de las instalaciones. Está prohibido fumar en el interior del alojamiento. No se permiten fiestas ni eventos sin autorización previa. El ruido debe mantenerse a un nivel razonable, especialmente entre las 22:00 y las 08:00 horas.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2. Política de Cancelación</h4>
                      <p className="text-muted-foreground">
                        Las cancelaciones realizadas con más de 7 días de antelación tendrán reembolso completo. Cancelaciones entre 3 y 7 días: 50% de reembolso. Cancelaciones con menos de 3 días: sin reembolso. En caso de no presentarse sin cancelación previa, no habrá reembolso.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">3. Responsabilidades</h4>
                      <p className="text-muted-foreground">
                        El huésped es responsable de cualquier daño causado al alojamiento durante su estancia. Se realizará inspección al check-out. Los daños serán cargados a la tarjeta de crédito proporcionada. El anfitrión no se hace responsable de pérdidas o robos de pertenencias personales.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">4. Protección de Datos</h4>
                      <p className="text-muted-foreground">
                        Los datos personales proporcionados serán tratados conforme al RGPD y la legislación española de protección de datos. La información será utilizada exclusivamente para la gestión de la reserva y el cumplimiento de obligaciones legales, incluyendo el registro de viajeros obligatorio.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">5. Términos Legales</h4>
                      <p className="text-muted-foreground">
                        Este contrato se rige por la legislación española. El huésped acepta cumplir con todas las leyes locales durante su estancia. El anfitrión se reserva el derecho de cancelar la reserva en caso de incumplimiento de las normas.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Checkbox de aceptación */}
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                <Checkbox
                  id="acceptTerms"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                />
                <Label htmlFor="acceptTerms" className="cursor-pointer leading-relaxed">
                  He leído y acepto el contrato de hospedaje y los términos y condiciones
                </Label>
              </div>

              {/* Área de firma */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">✍️ Firma aquí:</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpiar
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={200}
                    className="w-full touch-none cursor-crosshair bg-card"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dibuja tu firma usando el ratón o tu dedo en pantallas táctiles
                </p>
              </div>

              {/* Navegación */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to={buildPathWithReservation("/register/preferences")} className="sm:w-auto">
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
                <Link to={buildPathWithReservation("/register/confirmation")} className="flex-1">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2 bg-gradient-primary hover:opacity-90"
                    disabled={!isFormValid}
                  >
                    ✓ Completar Registro
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RegisterTerms;
