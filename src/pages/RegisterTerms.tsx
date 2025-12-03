import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import { useReservation } from "@/hooks/useReservation";
import { guestService, preferenceService, handleApiError } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import FloatingActionBar from "@/components/FloatingActionBar";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const RegisterTerms = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { buildPathWithReservation } = useReservationParams();
  const { guestData, preferenceData, signatureData, setSignatureData, clearRegistrationData, isGuestDataComplete } = useRegistrationFlow();
  const { reservationData, refreshReservation } = useReservation();

  const [accepted, setAccepted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Redirección automática al dashboard si todos los huéspedes están registrados
  const totalGuests = reservationData?.total_guests || 0;
  const registeredGuests = reservationData?.registered_guests || 0;
  const allGuestsRegistered = totalGuests > 0 && registeredGuests >= totalGuests;

  useEffect(() => {
    if (allGuestsRegistered && totalGuests > 0) {
      navigate(buildPathWithReservation('/dashboard'));
    }
  }, [allGuestsRegistered, totalGuests, navigate, buildPathWithReservation]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSigning(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'hsl(var(--foreground))';

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | TouchEvent) => {
    if (!isSigning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsSigning(false);
  };

  // Agregar event listeners para touch con {passive: false}
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startDrawing(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      draw(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    // Agregar listeners con passive: false para poder usar preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSigning]); // Agregar isSigning como dependencia

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const isFormValid = accepted && hasSignature;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que tengamos los datos del huésped
    if (!isGuestDataComplete || !guestData) {
      toast({
        title: "Error",
        description: "No se encontraron datos del huésped. Por favor, completa el registro nuevamente.",
        variant: "destructive",
      });
      navigate(buildPathWithReservation("/register"));
      return;
    }

    // Validar que tengamos reservation_id
    if (!reservationData?.id) {
      toast({
        title: "Error",
        description: "No se encontró información de la reserva.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid) {
      toast({
        title: "Campos requeridos",
        description: "Debes aceptar los términos y firmar para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. CAPTURAR FIRMA DEL CANVAS COMO BLOB
      const canvas = canvasRef.current;
      if (!canvas) {
        toast({
          title: "Error",
          description: "No se pudo capturar la firma.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Convertir canvas a blob
      const signatureBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo generar la imagen de la firma'));
          }
        }, 'image/png');
      });

      // 2. CREAR FORMDATA CON TODOS LOS DATOS
      const formData = new FormData();

      // Datos de reserva y documento
      formData.append('reservation_id', String(reservationData.id));
      formData.append('document_type', guestData.document_type);
      formData.append('document_number', guestData.document_number);
      formData.append('nationality', guestData.nationality);

      // Datos personales
      formData.append('first_name', guestData.first_name);
      formData.append('last_name', guestData.last_name);
      formData.append('birth_date', guestData.birth_date);
      formData.append('sex', guestData.sex);

      // Datos de contacto (REQUERIDOS)
      formData.append('phone_country_code', guestData.phone_country_code);
      formData.append('phone', guestData.phone);
      formData.append('email', guestData.email);

      // Datos de residencia (REQUERIDOS)
      formData.append('residence_country', guestData.residence_country);
      formData.append('residence_address', guestData.residence_address);

      // Datos de registro
      formData.append('is_responsible', guestData.is_responsible ? '1' : '0');
      formData.append('registration_method', guestData.registration_method);
      formData.append('accepted_terms', '1');

      // Campos opcionales pero comunes
      if (guestData.second_last_name) formData.append('second_last_name', guestData.second_last_name);
      if (guestData.support_number) formData.append('support_number', guestData.support_number);
      if (guestData.issue_date) formData.append('issue_date', guestData.issue_date);
      if (guestData.expiry_date) formData.append('expiry_date', guestData.expiry_date);
      if (guestData.relationship) formData.append('relationship', guestData.relationship);
      if (guestData.residence_municipality_code) formData.append('residence_municipality_code', guestData.residence_municipality_code);
      if (guestData.residence_municipality_name) formData.append('residence_municipality_name', guestData.residence_municipality_name);
      if (guestData.residence_postal_code) formData.append('residence_postal_code', guestData.residence_postal_code);
      if (guestData.document_image_path) formData.append('document_image_path', guestData.document_image_path);

      // Agregar firma como archivo
      formData.append('signature', signatureBlob, `signature_${guestData.document_number}.png`);

      // 3. GUARDAR HUÉSPED EN DB CON FIRMA
      const guestResponse = await guestService.createWithSignature(formData);

      const createdGuest = guestResponse.data.data;

      // 4. SI ES RESPONSABLE, GUARDAR PREFERENCIAS
      if (guestData.is_responsible && preferenceData) {
        await preferenceService.save({
          reservation_id: reservationData.id,
          ...preferenceData,
        });
      }

      // 5. ACTUALIZAR DATOS DE LA RESERVA
      await refreshReservation();

      // 6. LIMPIAR CONTEXTO TEMPORAL
      clearRegistrationData();

      toast({
        title: "¡Registro completado!",
        description: "Tu información ha sido guardada correctamente.",
        variant: "success",
      });

      // 7. REDIRIGIR A CONFIRMACIÓN
      navigate(buildPathWithReservation("/register/confirmation"));
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error al completar registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
              {t('terms.step')} <span className="text-foreground">3</span> {t('terms.of')} 3
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">📄 {t('terms.title')}</h1>
            <p className="text-muted-foreground">
              {t('terms.subtitle')}
            </p>
          </div>

          <Card className="p-6 md:p-8 shadow-elegant">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contrato scrollable */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t('terms.termsAndConditions')}</h3>
                  {/* Enlace al modelo de contrato */}
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost.local'}/uploads/contracts/modelo/modelo_contrato_vacanfly.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    📄 {t('dashboard.downloadContractModel')}
                  </a>
                </div>
                <ScrollArea className="h-[300px] w-full rounded-lg border p-4">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">{t('terms.keySummary')}</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>{t('terms.checkInTime')}</li>
                        <li>{t('terms.checkOutTime')}</li>
                        <li>{t('terms.noSmoking')}</li>
                        <li>{t('terms.noPets')}</li>
                        <li>{t('terms.maxCapacity')}</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">1. {t('terms.accommodationRules')}</h4>
                      <p className="text-muted-foreground">
                        El huésped se compromete a mantener el alojamiento en buen estado y hacer un uso responsable de las instalaciones. Está prohibido fumar en el interior del alojamiento. No se permiten fiestas ni eventos sin autorización previa. El ruido debe mantenerse a un nivel razonable, especialmente entre las 22:00 y las 08:00 horas.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2. {t('terms.cancellationPolicy')}</h4>
                      <p className="text-muted-foreground">
                        Las cancelaciones realizadas con más de 7 días de antelación tendrán reembolso completo. Cancelaciones entre 3 y 7 días: 50% de reembolso. Cancelaciones con menos de 3 días: sin reembolso. En caso de no presentarse sin cancelación previa, no habrá reembolso.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">3. {t('terms.responsibilities')}</h4>
                      <p className="text-muted-foreground">
                        El huésped es responsable de cualquier daño causado al alojamiento durante su estancia. Se realizará inspección al check-out. Los daños serán cargados a la tarjeta de crédito proporcionada. El anfitrión no se hace responsable de pérdidas o robos de pertenencias personales.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">4. {t('terms.dataProtection')}</h4>
                      <p className="text-muted-foreground">
                        Los datos personales proporcionados serán tratados conforme al RGPD y la legislación española de protección de datos. La información será utilizada exclusivamente para la gestión de la reserva y el cumplimiento de obligaciones legales, incluyendo el registro de viajeros obligatorio.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">5. {t('terms.legalTerms')}</h4>
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
                  {t('terms.acceptCheckbox')}
                </Label>
              </div>

              {/* Área de firma */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">✍️ {t('terms.signHere')}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('terms.clear')}
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={350}
                    className="w-full touch-none cursor-crosshair bg-card"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('terms.signatureHelp')}
                </p>
              </div>

              {/* Navegación */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link
                  to={buildPathWithReservation(
                    guestData?.is_responsible ? "/register/preferences" : "/register"
                  )}
                  className="sm:w-auto"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('terms.back')}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                  disabled={!isFormValid || loading}
                >
                  {loading ? t('terms.saving') : t('terms.complete')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      {/* Barra flotante con idioma y contacto */}
      <FloatingActionBar />
    </div>
  );
};

export default RegisterTerms;
