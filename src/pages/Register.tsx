import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Edit3, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { guestService, handleApiError } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const Register = () => {
  const navigate = useNavigate();
  const { reservationData, refreshReservation, guests } = useReservation();
  const { buildPathWithReservation } = useReservationParams();

  // Verificar si ya hay un huésped responsable
  const hasResponsible = guests.some(guest => guest.is_responsible);

  const [step, setStep] = useState<"method" | "upload" | "form">("method");
  const [captureMethod, setCaptureMethod] = useState<"scan" | "manual" | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [documentType, setDocumentType] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isResponsible, setIsResponsible] = useState(false);

  const handleMethodSelect = (method: "scan" | "manual") => {
    setCaptureMethod(method);
    if (method === "scan") {
      setStep("upload");
    } else {
      setStep("form");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setStep("form");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que tengamos reservation_id
    if (!reservationData?.id) {
      toast({
        title: "Error",
        description: "No se encontró información de la reserva. Por favor, accede con el código de reserva.",
        variant: "destructive",
      });
      return;
    }

    // Validaciones básicas
    if (!documentType || !documentNumber || !nationality || !firstName || !lastName || !birthDate || !sex) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios marcados con *",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Si ya hay responsable, forzar is_responsible a false
      const isResponsibleValue = hasResponsible ? false : isResponsible;

      await guestService.create({
        reservation_id: reservationData.id,
        document_type: documentType as 'dni' | 'nie' | 'passport' | 'other',
        document_number: documentNumber,
        nationality: nationality,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        sex: sex as 'm' | 'f' | 'other' | 'prefer-not',
        phone: phone || undefined,
        email: email || undefined,
        is_responsible: isResponsibleValue,
        registration_method: captureMethod || 'manual',
        document_image_path: uploadedImage || undefined,
        accepted_terms: true,
      });

      // Actualizar datos de la reserva
      await refreshReservation();

      toast({
        title: "¡Registro exitoso!",
        description: "Tus datos han sido guardados correctamente.",
      });

      // Redirigir según si es responsable o no
      if (isResponsibleValue) {
        navigate(buildPathWithReservation("/register/preferences"));
      } else {
        navigate(buildPathWithReservation("/register/terms"));
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error al registrar",
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
            <Link to={buildPathWithReservation("/")}>
            <img src={vacanflyLogo} alt="Vacanfly" className="w-20" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div className="w-12 h-1 bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div className="w-12 h-1 bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">
                3
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Paso <span className="text-foreground">1</span> de 3
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {step === "method" ? (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Registro de Huésped</h1>
                <p className="text-muted-foreground">
                  Elige cómo prefieres introducir tus datos
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Opción: Escanear documento */}
                <Card
                  className="p-8 cursor-pointer hover-lift group"
                  onClick={() => handleMethodSelect("scan")}
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Escanear documento
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Rápido y automático
                      </p>
                      <div className="inline-flex items-center gap-1 text-xs text-success px-3 py-1 bg-success/10 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Recomendado
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Extracción automática de datos con IA
                    </p>
                  </div>
                </Card>

                {/* Opción: Introducir manualmente */}
                <Card
                  className="p-8 cursor-pointer hover-lift group"
                  onClick={() => handleMethodSelect("manual")}
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                      <Edit3 className="w-10 h-10 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Introducir manualmente
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Prefiero escribir
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formulario guiado paso a paso
                    </p>
                  </div>
                </Card>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  💡 <span className="font-medium text-foreground">Consejo:</span> El escaneo es más rápido y evita errores
                </p>
              </div>
            </div>
          ) : step === "upload" ? (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Subir Documento</h1>
                <p className="text-muted-foreground">
                  Sube una foto de tu documento de identidad
                </p>
              </div>

              <Card className="p-8 shadow-elegant">
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="documentUpload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="documentUpload" className="cursor-pointer space-y-4 block">
                      <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-2">
                          Selecciona o toma una foto
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG o JPEG (Máx. 10MB)
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="lg">
                        Seleccionar archivo
                      </Button>
                    </label>
                  </div>

                  {uploadedImage && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium">Vista previa:</p>
                      <img
                        src={uploadedImage}
                        alt="Documento subido"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => setStep("method")}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </Button>
                    {uploadedImage && (
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                        onClick={() => setStep("form")}
                      >
                        Continuar
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Información Personal</h1>
                <p className="text-muted-foreground">
                  {captureMethod === "scan"
                    ? "Revisa y completa los datos extraídos"
                    : "Completa tus datos de registro"}
                </p>
              </div>

              <Card className="p-6 md:p-8 shadow-elegant">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Sección: Documento de Identidad */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        1
                      </div>
                      Documento de Identidad
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="docType">Tipo de Documento *</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger id="docType">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dni">DNI</SelectItem>
                            <SelectItem value="nie">NIE</SelectItem>
                            <SelectItem value="passport">Pasaporte</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nacionalidad *</Label>
                        <Select value={nationality} onValueChange={setNationality}>
                          <SelectTrigger id="nationality">
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">🇪🇸 España</SelectItem>
                            <SelectItem value="fr">🇫🇷 Francia</SelectItem>
                            <SelectItem value="de">🇩🇪 Alemania</SelectItem>
                            <SelectItem value="uk">🇬🇧 Reino Unido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="docNumber">Número de Documento *</Label>
                        <Input
                          id="docNumber"
                          placeholder="Ej: 12345678A"
                          className="h-12"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Datos Personales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        2
                      </div>
                      Datos Personales
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombres *</Label>
                        <Input
                          id="firstName"
                          placeholder="Nombre(s)"
                          className="h-12"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Primer Apellido *</Label>
                        <Input
                          id="lastName"
                          placeholder="Apellido"
                          className="h-12"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          className="h-12"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">Sexo *</Label>
                        <Select value={sex} onValueChange={setSex}>
                          <SelectTrigger id="sex">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m">Masculino</SelectItem>
                            <SelectItem value="f">Femenino</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                            <SelectItem value="prefer-not">Prefiero no decir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Mostrar checkbox de responsable solo si no hay uno ya */}
                      {!hasResponsible && (
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center space-x-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <Checkbox
                              id="isResponsible"
                              checked={isResponsible}
                              onCheckedChange={(checked) => setIsResponsible(checked as boolean)}
                            />
                            <Label htmlFor="isResponsible" className="cursor-pointer font-medium">
                              Soy el responsable de la reserva
                            </Label>
                          </div>
                        </div>
                      )}
                      {hasResponsible && (
                        <div className="space-y-2 md:col-span-2">
                          <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                            <p className="text-sm text-muted-foreground">
                              ℹ️ Ya hay un huésped responsable registrado para esta reserva
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección: Información de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        3
                      </div>
                      Información de Contacto
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+34 600 000 000"
                          className="h-12"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          className="h-12"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Navegación */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => setStep("method")}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Continuar"}
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
          )}
        </div>
      </main>
    </div>
  );
};

export default Register;
