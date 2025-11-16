import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Edit3, ArrowRight, ArrowLeft, CheckCircle2, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import { toast } from "@/hooks/use-toast";
import vacanflyLogo from "@/assets/vacanfly-logo.png";
import { DOCUMENT_TYPES, RELATIONSHIP_TYPES, SEX_OPTIONS, calculateAge, isMinor, requiresSecondSurname, requiresSupportNumber } from "@/lib/catalogs";
import { validateDNI, validateNIE, validateDocument } from "@/lib/documentValidation";
import { countryService, municipalityService } from "@/services/api";
import type { Country, Municipality } from "@/schemas/guestSchema";

const Register = () => {
  const navigate = useNavigate();
  const { reservationData, guests } = useReservation();
  const { buildPathWithReservation } = useReservationParams();
  const { setGuestData } = useRegistrationFlow();

  // Verificar si ya hay un huésped responsable
  const hasResponsible = guests.some(guest => guest.is_responsible);

  const [step, setStep] = useState<"method" | "upload" | "form">("method");
  const [captureMethod, setCaptureMethod] = useState<"scan" | "manual" | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Form state - Documento
  const [documentType, setDocumentType] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [supportNumber, setSupportNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Form state - Personal
  const [nationality, setNationality] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [sex, setSex] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("");

  // Form state - Residencia
  const [residenceCountry, setResidenceCountry] = useState("");
  const [residenceMunicipalityCode, setResidenceMunicipalityCode] = useState("");
  const [residenceMunicipalityName, setResidenceMunicipalityName] = useState("");
  const [residencePostalCode, setResidencePostalCode] = useState("");
  const [residenceAddress, setResidenceAddress] = useState("");

  // Form state - Contacto
  const [phoneCountryCode, setPhoneCountryCode] = useState("+34");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isResponsible, setIsResponsible] = useState(false);

  // Estados para autocompletado y búsqueda
  const [countries, setCountries] = useState<Country[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  // Estados para validación de documentos
  const [documentError, setDocumentError] = useState<string>("");

  // Cargar países al montar el componente
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await countryService.getAll();
        if (response.data.success) {
          setCountries(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando países:', error);
      }
    };
    loadCountries();
  }, []);

  // Calcular edad automáticamente cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (birthDate) {
      const calculatedAge = calculateAge(birthDate);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [birthDate]);

  // Auto-seleccionar nacionalidad española para DNI/NIE
  useEffect(() => {
    if (documentType === 'DNI' || documentType === 'NIE') {
      setNationality('ES');
    }
  }, [documentType]);

  // Buscar municipios con debounce
  useEffect(() => {
    if (residenceCountry === 'ES' && municipalitySearch.length >= 2) {
      const timer = setTimeout(async () => {
        setLoadingMunicipalities(true);
        try {
          const response = await municipalityService.search(municipalitySearch);
          if (response.data.success) {
            setMunicipalities(response.data.data);
          }
        } catch (error) {
          console.error('Error buscando municipios:', error);
        } finally {
          setLoadingMunicipalities(false);
        }
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timer);
    } else {
      setMunicipalities([]);
    }
  }, [municipalitySearch, residenceCountry]);

  // Filtrar países por búsqueda
  useEffect(() => {
    if (countrySearch.length >= 2) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearch.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries([]);
    }
  }, [countrySearch, countries]);

  // Validar formato de documento en tiempo real
  useEffect(() => {
    if (documentNumber && documentType) {
      const result = validateDocument(documentType, documentNumber);
      if (!result.valid && documentNumber.length > 5) {
        setDocumentError(result.error || "");
      } else {
        setDocumentError("");
      }
    } else {
      setDocumentError("");
    }
  }, [documentNumber, documentType]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Helper para scroll y focus a un campo
    const focusField = (fieldId: string, errorMessage: string) => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          element.focus();
        }, 300);
      }
      toast({
        title: "Campo requerido",
        description: errorMessage,
        variant: "destructive",
      });
    };

    // Validar que tengamos reservation_id
    if (!reservationData?.id) {
      toast({
        title: "Error",
        description: "No se encontró información de la reserva. Por favor, accede con el código de reserva.",
        variant: "destructive",
      });
      return;
    }

    // Validaciones básicas obligatorias - Documento
    if (!documentType) {
      focusField("docType", "Debes seleccionar el tipo de documento");
      return;
    }

    if (!documentNumber) {
      focusField("docNumber", "Debes ingresar el número de documento");
      return;
    }

    // Validar formato de documento DNI/NIE
    if (documentType === 'DNI' || documentType === 'NIE') {
      const validationResult = validateDocument(documentType, documentNumber);
      if (!validationResult.valid) {
        focusField("docNumber", validationResult.error || "Formato de documento inválido");
        return;
      }
    }

    // Validaciones condicionales - DNI/NIE requiere número de soporte
    if ((documentType === 'DNI' || documentType === 'NIE') && !supportNumber) {
      focusField("supportNumber", "El número de soporte es obligatorio para DNI/NIE");
      return;
    }

    // Validaciones de datos personales
    if (!nationality) {
      focusField("nationality", "Debes seleccionar la nacionalidad");
      return;
    }

    if (!firstName) {
      focusField("firstName", "Debes ingresar el nombre");
      return;
    }

    if (!lastName) {
      focusField("lastName", "Debes ingresar el primer apellido");
      return;
    }

    // Validaciones condicionales - DNI/NIE requiere segundo apellido
    if ((documentType === 'DNI' || documentType === 'NIE') && !secondLastName) {
      focusField("secondLastName", "El segundo apellido es obligatorio para DNI/NIE");
      return;
    }

    if (!birthDate) {
      focusField("birthDate", "Debes ingresar la fecha de nacimiento");
      return;
    }

    if (!sex) {
      focusField("sex", "Debes seleccionar el sexo");
      return;
    }

    // Validación condicional - Menor de edad
    if (age !== null && age < 18 && !relationship) {
      focusField("relationship", "El parentesco es obligatorio para menores de 18 años");
      return;
    }

    // Validaciones de residencia
    if (!residenceCountry) {
      focusField("residenceCountry", "Debes seleccionar el país de residencia");
      return;
    }

    // Validación condicional - España requiere municipio
    if (residenceCountry === 'ES' && !residenceMunicipalityCode && !residenceMunicipalityName) {
      focusField("municipalitySearch", "Debes seleccionar un municipio español");
      return;
    }

    // Para países no españoles, verificar que se haya ingresado la ciudad
    if (residenceCountry !== 'ES' && !residenceMunicipalityName) {
      focusField("residenceMunicipalityName", "Debes ingresar la ciudad o municipio");
      return;
    }

    if (!residenceAddress) {
      focusField("residenceAddress", "Debes ingresar la dirección completa");
      return;
    }

    // Validaciones de contacto
    if (!phoneCountryCode) {
      focusField("phoneCountryCode", "Debes seleccionar el código de país");
      return;
    }

    if (!phone) {
      focusField("phone", "Debes ingresar el número de teléfono");
      return;
    }

    if (!email) {
      focusField("email", "Debes ingresar el correo electrónico");
      return;
    }

    // Validación - Email formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      focusField("email", "Por favor ingresa un correo electrónico válido");
      return;
    }

    // Si ya hay responsable, forzar is_responsible a false
    const isResponsibleValue = hasResponsible ? false : isResponsible;

    // GUARDAR TEMPORALMENTE EN CONTEXTO (NO en DB todavía)
    setGuestData({
      document_type: documentType.toUpperCase() as any,
      document_number: documentNumber,
      support_number: supportNumber || undefined,
      issue_date: issueDate || undefined,
      expiry_date: expiryDate || undefined,
      nationality: nationality,
      first_name: firstName,
      last_name: lastName,
      second_last_name: secondLastName || undefined,
      birth_date: birthDate,
      sex: sex as 'm' | 'f' | 'other' | 'prefer-not',
      relationship: relationship || undefined,
      residence_country: residenceCountry,
      residence_municipality_code: residenceMunicipalityCode || undefined,
      residence_municipality_name: residenceMunicipalityName || undefined,
      residence_postal_code: residencePostalCode || undefined,
      residence_address: residenceAddress,
      phone_country_code: phoneCountryCode,
      phone: phone,
      email: email,
      is_responsible: isResponsibleValue,
      registration_method: captureMethod || 'manual',
      document_image_path: uploadedImage || undefined,
    } as any);

    // Redirigir según si es responsable o no
    if (isResponsibleValue) {
      navigate(buildPathWithReservation("/register/preferences"));
    } else {
      navigate(buildPathWithReservation("/register/terms"));
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
                      📄 Documento de Identidad
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="docType">Tipo de Documento *</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger id="docType">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docNumber">Número de Documento *</Label>
                        <Input
                          id="docNumber"
                          placeholder={documentType === 'DNI' ? "Ej: 12345678Z" : documentType === 'NIE' ? "Ej: X1234567L" : "Número de documento"}
                          className={`h-12 ${documentError ? 'border-destructive' : ''}`}
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                          required
                        />
                        {documentError && (
                          <p className="text-xs text-destructive">
                            ⚠️ {documentError}
                          </p>
                        )}
                        {!documentError && documentNumber && documentType === 'DNI' && (
                          <p className="text-xs text-success">
                            ✓ Formato de DNI correcto
                          </p>
                        )}
                        {!documentError && documentNumber && documentType === 'NIE' && (
                          <p className="text-xs text-success">
                            ✓ Formato de NIE correcto
                          </p>
                        )}
                      </div>
                      {requiresSupportNumber(documentType) && (
                        <div className="space-y-2">
                          <Label htmlFor="supportNumber">Número de Soporte *</Label>
                          <Input
                            id="supportNumber"
                            placeholder="Ej: ABC123456"
                            className="h-12"
                            value={supportNumber}
                            onChange={(e) => setSupportNumber(e.target.value.toUpperCase())}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            📌 Aparece en la parte superior del DNI/NIE
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">Fecha de Expedición</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          className="h-12"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          className="h-12"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
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
                      👤 Datos Personales
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nacionalidad *</Label>
                        {(documentType === 'DNI' || documentType === 'NIE') ? (
                          <>
                            <Input
                              id="nationality"
                              className="h-12"
                              value="España"
                              disabled
                            />
                            <p className="text-xs text-muted-foreground">
                              Auto-asignado para DNI/NIE
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="nationality"
                                placeholder="Buscar país..."
                                className="h-12 pl-10"
                                value={countrySearch || countries.find(c => c.code === nationality)?.name || ""}
                                onChange={(e) => {
                                  setCountrySearch(e.target.value);
                                  if (!e.target.value) setNationality("");
                                }}
                                required
                              />
                            </div>
                            {filteredCountries.length > 0 && (
                              <div className="border rounded-lg max-h-48 overflow-y-auto">
                                {filteredCountries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                                    onClick={() => {
                                      setNationality(country.code);
                                      setCountrySearch(country.name);
                                      setFilteredCountries([]);
                                    }}
                                  >
                                    {country.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
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
                          placeholder="Primer apellido"
                          className="h-12"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                      {requiresSecondSurname(documentType) && (
                        <div className="space-y-2">
                          <Label htmlFor="secondLastName">Segundo Apellido *</Label>
                          <Input
                            id="secondLastName"
                            placeholder="Segundo apellido"
                            className="h-12"
                            value={secondLastName}
                            onChange={(e) => setSecondLastName(e.target.value)}
                            required
                          />
                        </div>
                      )}
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
                        {age !== null && (
                          <p className="text-xs text-muted-foreground">
                            📅 Edad: {age} años
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">Sexo *</Label>
                        <Select value={sex} onValueChange={setSex}>
                          <SelectTrigger id="sex">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEX_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {age !== null && age < 18 && (
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="relationship">Parentesco con el Responsable *</Label>
                          <Select value={relationship} onValueChange={setRelationship}>
                            <SelectTrigger id="relationship">
                              <SelectValue placeholder="Seleccionar parentesco" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_TYPES.map((rel) => (
                                <SelectItem key={rel.value} value={rel.value}>
                                  {rel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-warning">
                            ⚠️ Obligatorio para menores de 18 años
                          </p>
                        </div>
                      )}
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

                  {/* Sección: Datos de Residencia */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        3
                      </div>
                      🏠 Datos de Residencia
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="residenceCountry">País de Residencia *</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="residenceCountry"
                            placeholder="Buscar país..."
                            className="h-12 pl-10"
                            value={countrySearch || countries.find(c => c.code === residenceCountry)?.name || ""}
                            onChange={(e) => {
                              setCountrySearch(e.target.value);
                              if (!e.target.value) {
                                setResidenceCountry("");
                                setResidenceMunicipalityCode("");
                                setResidenceMunicipalityName("");
                                setResidencePostalCode("");
                              }
                            }}
                            required
                          />
                        </div>
                        {filteredCountries.length > 0 && (
                          <div className="border rounded-lg max-h-48 overflow-y-auto z-10 bg-background">
                            {filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                                onClick={() => {
                                  setResidenceCountry(country.code);
                                  setCountrySearch(country.name);
                                  setFilteredCountries([]);
                                  setResidenceMunicipalityCode("");
                                  setResidenceMunicipalityName("");
                                  setResidencePostalCode("");
                                }}
                              >
                                {country.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {residenceCountry === 'ES' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="municipalitySearch">Municipio *</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="municipalitySearch"
                                placeholder="Buscar municipio..."
                                className="h-12 pl-10"
                                value={municipalitySearch}
                                onChange={(e) => setMunicipalitySearch(e.target.value)}
                              />
                            </div>
                            {loadingMunicipalities && (
                              <p className="text-xs text-muted-foreground">Buscando...</p>
                            )}
                            {municipalities.length > 0 && (
                              <div className="border rounded-lg max-h-48 overflow-y-auto">
                                {municipalities.map((mun) => (
                                  <button
                                    key={mun.code}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                                    onClick={() => {
                                      setResidenceMunicipalityCode(mun.code);
                                      setResidenceMunicipalityName(mun.name);
                                      setResidencePostalCode(mun.postal_code);
                                      setMunicipalitySearch(mun.display_name);
                                      setMunicipalities([]);
                                    }}
                                  >
                                    {mun.display_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="residencePostalCode">Código Postal *</Label>
                            <Input
                              id="residencePostalCode"
                              placeholder="28001"
                              className="h-12"
                              value={residencePostalCode}
                              onChange={(e) => setResidencePostalCode(e.target.value)}
                              disabled
                            />
                            <p className="text-xs text-muted-foreground">
                              Se completa automáticamente al seleccionar municipio
                            </p>
                          </div>
                        </>
                      ) : residenceCountry ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="residenceMunicipalityName">Ciudad/Municipio *</Label>
                            <Input
                              id="residenceMunicipalityName"
                              placeholder="Nombre de la ciudad"
                              className="h-12"
                              value={residenceMunicipalityName}
                              onChange={(e) => setResidenceMunicipalityName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="residencePostalCode">Código Postal</Label>
                            <Input
                              id="residencePostalCode"
                              placeholder="Código postal"
                              className="h-12"
                              value={residencePostalCode}
                              onChange={(e) => setResidencePostalCode(e.target.value)}
                            />
                          </div>
                        </>
                      ) : null}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="residenceAddress">Dirección Completa *</Label>
                        <Input
                          id="residenceAddress"
                          placeholder="Calle, número, piso, puerta..."
                          className="h-12"
                          value={residenceAddress}
                          onChange={(e) => setResidenceAddress(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Información de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        4
                      </div>
                      📞 Información de Contacto
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="phoneCountryCode">Código País *</Label>
                        <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                          <SelectTrigger id="phoneCountryCode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+34">🇪🇸 +34 (España)</SelectItem>
                            <SelectItem value="+33">🇫🇷 +33 (Francia)</SelectItem>
                            <SelectItem value="+49">🇩🇪 +49 (Alemania)</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44 (Reino Unido)</SelectItem>
                            <SelectItem value="+351">🇵🇹 +351 (Portugal)</SelectItem>
                            <SelectItem value="+39">🇮🇹 +39 (Italia)</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1 (USA/Canadá)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Número de Teléfono *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="600 000 000"
                          className="h-12"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          className="h-12"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
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
          )}
        </div>
      </main>
    </div>
  );
};

export default Register;
