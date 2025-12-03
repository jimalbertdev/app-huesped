import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Edit3, ArrowRight, ArrowLeft, CheckCircle2, Search, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import vacanflyLogo from "@/assets/vacanfly-logo.png";
import { DOCUMENT_TYPES, RELATIONSHIP_TYPES, SEX_OPTIONS, calculateAge, isMinor, requiresSecondSurname, requiresSupportNumber } from "@/lib/catalogs";
import { validateDNI, validateNIE, validateDocument } from "@/lib/documentValidation";
import { validatePhoneNumber, COUNTRY_CODES } from "@/lib/phoneValidation";
import { countryService, municipalityService, postalCodeService, documentScanService, clientService } from "@/services/api";
import type { Country, Municipality } from "@/schemas/guestSchema";
import { PhoneCountryCodeSelect } from "@/components/PhoneCountryCodeSelect";
import FloatingActionBar from "@/components/FloatingActionBar";

const Register = () => {
  const navigate = useNavigate();
  const { reservationData, guests } = useReservation();
  const { buildPathWithReservation } = useReservationParams();
  const { setGuestData, guestData } = useRegistrationFlow();
  const { t } = useLanguage();

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
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [residenceCountrySearch, setResidenceCountrySearch] = useState("");
  const [filteredCountriesNationality, setFilteredCountriesNationality] = useState<Country[]>([]);
  const [filteredCountriesResidence, setFilteredCountriesResidence] = useState<Country[]>([]);
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [postalCodes, setPostalCodes] = useState<{ value: string; label: string }[]>([]);
  const [loadingPostalCodes, setLoadingPostalCodes] = useState(false);
  const [postalCodeSearch, setPostalCodeSearch] = useState("");
  const [filteredPostalCodes, setFilteredPostalCodes] = useState<{ value: string; label: string }[]>([]);

  // Estados para validación de documentos
  const [documentError, setDocumentError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [scanningDocument, setScanningDocument] = useState(false);

  // Estados para validación de autocomplete (sin resultados)
  const [nationalityNotFound, setNationalityNotFound] = useState(false);
  const [residenceCountryNotFound, setResidenceCountryNotFound] = useState(false);
  const [municipalityNotFound, setMunicipalityNotFound] = useState(false);
  const [postalCodeNotFound, setPostalCodeNotFound] = useState(false);

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

  // Redirección automática al dashboard si todos los huéspedes están registrados
  const totalGuests = reservationData?.total_guests || 0;
  const registeredGuests = reservationData?.registered_guests || 0;
  const allGuestsRegistered = totalGuests > 0 && registeredGuests >= totalGuests;

  useEffect(() => {
    if (allGuestsRegistered && totalGuests > 0) {
      navigate(buildPathWithReservation('/dashboard'));
    }
  }, [allGuestsRegistered, totalGuests, navigate, buildPathWithReservation]);

  // Restaurar datos del formulario desde el contexto (al volver atrás)
  useEffect(() => {
    if (guestData && countries.length > 0) {
      // Datos de documento
      if (guestData.document_type) setDocumentType(guestData.document_type);
      if (guestData.document_number) setDocumentNumber(guestData.document_number);
      if (guestData.support_number) setSupportNumber(guestData.support_number);
      if (guestData.issue_date) setIssueDate(guestData.issue_date);
      if (guestData.expiry_date) setExpiryDate(guestData.expiry_date);

      // Datos personales
      if (guestData.nationality) {
        setNationality(guestData.nationality);
        const country = countries.find(c => c.code === guestData.nationality);
        if (country) setNationalitySearch(country.name);
      }
      if (guestData.first_name) setFirstName(guestData.first_name);
      if (guestData.last_name) setLastName(guestData.last_name);
      if (guestData.second_last_name) setSecondLastName(guestData.second_last_name);
      if (guestData.birth_date) setBirthDate(guestData.birth_date);
      if (guestData.sex) setSex(guestData.sex);
      if (guestData.relationship) setRelationship(guestData.relationship);

      // Datos de residencia
      if (guestData.residence_country) {
        setResidenceCountry(guestData.residence_country);
        const country = countries.find(c => c.code === guestData.residence_country);
        if (country) setResidenceCountrySearch(country.name);
      }
      if (guestData.residence_municipality_code) setResidenceMunicipalityCode(guestData.residence_municipality_code);
      if (guestData.residence_municipality_name) setResidenceMunicipalityName(guestData.residence_municipality_name);
      if (guestData.residence_postal_code) setResidencePostalCode(guestData.residence_postal_code);
      if (guestData.residence_address) setResidenceAddress(guestData.residence_address);

      // Datos de contacto
      if (guestData.phone_country_code) setPhoneCountryCode(guestData.phone_country_code);
      if (guestData.phone) setPhone(guestData.phone);
      if (guestData.email) setEmail(guestData.email);
      if (guestData.is_responsible !== undefined) setIsResponsible(guestData.is_responsible);

      // Avanzar directamente al formulario si ya había datos
      if (step === "method") {
        setStep("form");
        setCaptureMethod("manual");
      }
    }
  }, [guestData, countries]);

  // Calcular edad automáticamente cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (birthDate) {
      const calculatedAge = calculateAge(birthDate);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [birthDate]);

  // Auto-seleccionar nacionalidad española para DNI/NIE - DESHABILITADO
  // El usuario debe seleccionar su nacionalidad manualmente
  // useEffect(() => {
  //   if (documentType === 'DNI' || documentType === 'NIE') {
  //     setNationality('ES');
  //   }
  // }, [documentType]);

  // Buscar municipios con debounce
  useEffect(() => {
    if (residenceCountry === 'ES' && municipalitySearch.length >= 2) {
      const timer = setTimeout(async () => {
        setLoadingMunicipalities(true);
        try {
          const response = await municipalityService.search(municipalitySearch);
          if (response.data.success) {
            setMunicipalities(response.data.data);
            // Marcar error si no hay resultados
            setMunicipalityNotFound(response.data.data.length === 0);
          }
        } catch (error) {
          console.error('Error buscando municipios:', error);
          setMunicipalityNotFound(true);
        } finally {
          setLoadingMunicipalities(false);
        }
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timer);
    } else {
      setMunicipalities([]);
      setMunicipalityNotFound(false);
    }
  }, [municipalitySearch, residenceCountry]);

  // Cargar códigos postales cuando se selecciona un municipio español
  useEffect(() => {
    const loadPostalCodes = async () => {
      if (residenceCountry === 'ES' && residenceMunicipalityCode) {
        setLoadingPostalCodes(true);
        try {
          const response = await postalCodeService.getByMunicipality(residenceMunicipalityCode);
          if (response.data.success) {
            setPostalCodes(response.data.data.postal_codes);
            setFilteredPostalCodes(response.data.data.postal_codes);
          }
        } catch (error) {
          console.error('Error cargando códigos postales:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los códigos postales del municipio",
            variant: "destructive",
          });
        } finally {
          setLoadingPostalCodes(false);
        }
      } else {
        setPostalCodes([]);
        setFilteredPostalCodes([]);
      }
    };
    loadPostalCodes();
  }, [residenceMunicipalityCode, residenceCountry]);

  // Filtrar códigos postales por búsqueda
  useEffect(() => {
    if (postalCodeSearch) {
      const filtered = postalCodes.filter(pc =>
        pc.value.includes(postalCodeSearch)
      );
      setFilteredPostalCodes(filtered);
      // Marcar error si no hay resultados y hay texto de búsqueda
      setPostalCodeNotFound(filtered.length === 0 && postalCodeSearch.length > 0);
    } else {
      setFilteredPostalCodes(postalCodes);
      setPostalCodeNotFound(false);
    }
  }, [postalCodeSearch, postalCodes]);

  // Filtrar países por búsqueda - Nacionalidad
  useEffect(() => {
    if (nationalitySearch.length >= 2) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(nationalitySearch.toLowerCase())
      );
      setFilteredCountriesNationality(filtered);
      // Marcar error si no hay resultados y el usuario ya seleccionó antes
      setNationalityNotFound(filtered.length === 0 && !nationality);
    } else {
      setFilteredCountriesNationality([]);
      setNationalityNotFound(false);
    }
  }, [nationalitySearch, countries, nationality]);

  // Filtrar países por búsqueda - País de Residencia
  useEffect(() => {
    if (residenceCountrySearch.length >= 2) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(residenceCountrySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(residenceCountrySearch.toLowerCase())
      );
      setFilteredCountriesResidence(filtered);
      // Marcar error si no hay resultados y el usuario ya seleccionó antes
      setResidenceCountryNotFound(filtered.length === 0 && !residenceCountry);
    } else {
      setFilteredCountriesResidence([]);
      setResidenceCountryNotFound(false);
    }
  }, [residenceCountrySearch, countries, residenceCountry]);

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

  // Validar formato de teléfono en tiempo real
  useEffect(() => {
    if (phone && phone.length > 3) {
      // Mapear código de país a ISO (ej: +34 → ES)
      const countryISO = COUNTRY_CODES.find(c => c.code === phoneCountryCode)?.country;

      const result = validatePhoneNumber(phone, countryISO);

      if (!result.valid) {
        setPhoneError(result.error || "Número de teléfono inválido");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  }, [phone, phoneCountryCode]);

  const handleMethodSelect = (method: "scan" | "manual") => {
    setCaptureMethod(method);
    if (method === "scan") {
      setStep("upload");
    } else {
      setStep("form");
    }
  };

  /**
   * Mapear tipo de documento de Klippa al formato del formulario
   */
  const mapDocumentType = (klippaType: string): string => {
    const type = klippaType?.toUpperCase() || '';

    if (type === 'DNI' || type === 'SPANISH_ID') return 'DNI';
    if (type === 'NIE' || type === 'FOREIGNER_ID') return 'NIE';
    if (type === 'PASSPORT' || type === 'PASAPORTE') return 'PAS';

    // Para cualquier otro tipo, usar "other"
    return 'other';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guardar imagen para mostrarla
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Escanear documento con Klippa
    setScanningDocument(true);
    try {
      const response = await documentScanService.scanDocument(file);

      // Log completo para debugging
      console.log('📄 Respuesta completa de Klippa:', response.data);
      console.log('📄 Datos extraídos:', response.data.data);

      if (response.data.success) {
        const data = response.data.data;

        // Autocompletar campos con datos extraídos - con mapeo de tipo
        if (data.document_type) {
          const mappedType = mapDocumentType(data.document_type);
          setDocumentType(mappedType);
          console.log(`🔄 Tipo de documento mapeado: ${data.document_type} → ${mappedType}`);
        }
        if (data.document_number) setDocumentNumber(data.document_number);
        if (data.support_number) setSupportNumber(data.support_number);
        if (data.first_name) setFirstName(data.first_name);
        if (data.last_name) setLastName(data.last_name);
        if (data.second_last_name) setSecondLastName(data.second_last_name);
        if (data.birth_date) setBirthDate(data.birth_date);
        if (data.sex) setSex(data.sex);
        if (data.nationality) {
          setNationality(data.nationality);
          // Buscar el nombre del país para mostrarlo
          const country = countries.find(c => c.code === data.nationality);
          if (country) setNationalitySearch(country.name);
        }
        if (data.issue_date) setIssueDate(data.issue_date);
        if (data.expiry_date) setExpiryDate(data.expiry_date);

        toast({
          title: "Documento escaneado",
          description: "Los datos se han cargado automáticamente. Revisa y completa la información faltante.",
        });

        setStep("form");
      } else {
        toast({
          title: "Error en el escaneo",
          description: "No se pudieron extraer los datos del documento. Por favor, intenta de nuevo o ingresa los datos manualmente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error escaneando documento:", error);
      toast({
        title: "Error en el escaneo",
        description: "Hubo un problema al procesar el documento. Por favor, intenta de nuevo o ingresa los datos manualmente.",
        variant: "destructive",
      });
      // Aún así permitir continuar al formulario
      setStep("form");
    } finally {
      setScanningDocument(false);
    }
  };

  /**
   * Manejar cambio del checkbox "Soy el responsable"
   * Si se marca, cargar datos del cliente automáticamente
   */
  const handleResponsibleChange = async (checked: boolean) => {
    setIsResponsible(checked);

    // Si se marca como responsable y hay cliente_id en la reserva
    if (checked && reservationData?.cliente_id) {
      try {
        const response = await clientService.getById(reservationData.cliente_id);

        if (response.data.success) {
          const clientData = response.data.data;

          // Autocompletar campos con datos del cliente
          if (clientData.document_type) setDocumentType(clientData.document_type);
          if (clientData.document_number) setDocumentNumber(clientData.document_number);
          if (clientData.first_name) setFirstName(clientData.first_name);
          if (clientData.last_name) setLastName(clientData.last_name);
          if (clientData.second_last_name) setSecondLastName(clientData.second_last_name);

          // Nacionalidad
          if (clientData.nationality) {
            setNationality(clientData.nationality);
            const country = countries.find(c => c.code === clientData.nationality);
            if (country) setNationalitySearch(country.name);
          }

          // Residencia
          if (clientData.residence_country) {
            setResidenceCountry(clientData.residence_country);
            const country = countries.find(c => c.code === clientData.residence_country);
            if (country) setResidenceCountrySearch(country.name);
          }
          if (clientData.residence_postal_code) setResidencePostalCode(clientData.residence_postal_code);
          if (clientData.residence_address) setResidenceAddress(clientData.residence_address);

          // Contacto
          if (clientData.phone_country_code) setPhoneCountryCode(clientData.phone_country_code);
          if (clientData.phone) setPhone(clientData.phone);
          if (clientData.email) setEmail(clientData.email);

          toast({
            title: "Datos cargados",
            description: "Tus datos como titular de la reserva se han cargado automáticamente. Revisa y completa la información faltante.",
          });
        }
      } catch (error) {
        console.error('Error cargando datos del cliente:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus datos. Por favor, ingrésalos manualmente.",
          variant: "destructive",
        });
      }
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

    // Validaciones condicionales - Solo DNI requiere segundo apellido
    if (documentType === 'DNI' && !secondLastName) {
      focusField("secondLastName", "El segundo apellido es obligatorio para DNI español");
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

    // Validación - Teléfono válido para el país seleccionado
    if (phoneError) {
      focusField("phone", phoneError);
      return;
    }

    // Validación adicional con libphonenumber-js
    const countryISO = COUNTRY_CODES.find(c => c.code === phoneCountryCode)?.country;
    if (countryISO) {
      const phoneValidation = validatePhoneNumber(phone, countryISO);
      if (!phoneValidation.valid) {
        focusField("phone", phoneValidation.error || "Número de teléfono inválido para el país seleccionado");
        return;
      }
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
              {t('register.step')} <span className="text-foreground">1</span> {t('register.of')} 3
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {step === "method" ? (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t('register.title')}</h1>
                <p className="text-muted-foreground">
                  {t('register.howToRegister')}
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
                        {t('register.scanDocument')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('register.fastAutomatic')}
                      </p>
                      <div className="inline-flex items-center gap-1 text-xs text-success px-3 py-1 bg-success/10 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('register.recommended')}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('register.aiExtraction')}
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
                        {t('register.enterManually')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('register.preferWrite')}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('register.guidedForm')}
                    </p>
                  </div>
                </Card>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  💡 <span className="font-medium text-foreground">{t('register.tip')}:</span> {t('register.scanTip')}
                </p>
              </div>
            </div>
          ) : step === "upload" ? (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t('register.uploadDocument')}</h1>
                <p className="text-muted-foreground">
                  {t('register.uploadPhotoId')}
                </p>
              </div>

              <Card className="p-8 shadow-elegant">
                <div className="space-y-6">
                  {scanningDocument ? (
                    <div className="border-2 border-dashed border-primary/50 rounded-xl p-12 text-center bg-primary/5">
                      <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse">
                          <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold mb-2">
                            {t('register.scanningDocument')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('register.extractingData')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="documentUpload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={scanningDocument}
                      />
                      <label htmlFor="documentUpload" className="cursor-pointer space-y-4 block">
                        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold mb-2">
                            {t('register.selectOrTakePhoto')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('register.fileFormats')}
                          </p>
                        </div>
                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 gap-2">
                          {t('register.selectFile')}
                        </div>
                      </label>
                    </div>
                  )}

                  {uploadedImage && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium">{t('register.preview')}:</p>
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
                      {t('register.back')}
                    </Button>
                    {uploadedImage && (
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                        onClick={() => setStep("form")}
                        disabled={scanningDocument}
                      >
                        {scanningDocument ? t('register.processing') : t('register.continue')}
                        {!scanningDocument && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t('register.personalInfo')}</h1>
                <p className="text-muted-foreground">
                  {captureMethod === "scan"
                    ? t('register.reviewExtractedData')
                    : t('register.completeYourData')}
                </p>
              </div>

              <Card className="p-6 md:p-8 shadow-elegant">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Checkbox: ¿Eres el responsable? - PRIMERO */}
                  {!hasResponsible && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-6 rounded-lg bg-blue-50 border-2 border-blue-200">
                        <Checkbox
                          id="isResponsible"
                          checked={isResponsible}
                          onCheckedChange={handleResponsibleChange}
                        />
                        <div className="flex-1">
                          <Label htmlFor="isResponsible" className="cursor-pointer text-lg font-semibold text-blue-900">
                            {t('register.imBookingHolder')}
                          </Label>
                          <p className="text-sm text-blue-700 mt-1">
                            {t('register.bookingHolderInfo')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {hasResponsible && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-muted">
                      <p className="text-sm text-muted-foreground">
                        ℹ️ {t('register.responsibleAlreadyExists')}
                      </p>
                    </div>
                  )}

                  {/* Sección: Documento de Identidad */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        1
                      </div>
                      📄 {t('register.identityDocument')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="docType">{t('register.documentType')} <span className="text-destructive">*</span></Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger id="docType">
                            <SelectValue placeholder={t('register.selectType')} />
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
                        <Label htmlFor="docNumber">{t('register.documentNumber')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="docNumber"
                          placeholder={documentType === 'DNI' ? t('register.dniPlaceholder') : documentType === 'NIE' ? t('register.niePlaceholder') : t('register.documentPlaceholder')}
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
                            ✓ {t('register.dniFormatCorrect')}
                          </p>
                        )}
                        {!documentError && documentNumber && documentType === 'NIE' && (
                          <p className="text-xs text-success">
                            ✓ {t('register.nieFormatCorrect')}
                          </p>
                        )}
                      </div>
                      {requiresSupportNumber(documentType) && (
                        <div className="space-y-2">
                          <Label htmlFor="supportNumber">{t('register.supportNumber')} <span className="text-destructive">*</span></Label>
                          <Input
                            id="supportNumber"
                            placeholder={t('register.passportPlaceholder')}
                            className="h-12"
                            value={supportNumber}
                            onChange={(e) => setSupportNumber(e.target.value.toUpperCase())}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('register.supportNumberHint')}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">{t('register.issueDate')}</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          className="h-12"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">{t('register.expiryDate')}</Label>
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
                      👤 {t('register.personalData')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="nationality">{t('register.nationality')} <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                          <Input
                            id="nationality"
                            placeholder={t('register.searchCountry')}
                            className={`h-12 pl-10 pr-10 ${nationalityNotFound ? 'border-destructive' : ''}`}
                            value={nationalitySearch || countries.find(c => c.code === nationality)?.name || ""}
                            onChange={(e) => {
                              setNationalitySearch(e.target.value);
                              if (!e.target.value) setNationality("");
                            }}
                            required
                          />
                        </div>
                        {filteredCountriesNationality.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 border-2 border-primary/30 rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
                            {filteredCountriesNationality.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
                                onClick={() => {
                                  setNationality(country.code);
                                  setNationalitySearch(country.name);
                                  setFilteredCountriesNationality([]);
                                }}
                              >
                                <ChevronDown className="w-3 h-3 rotate-[-90deg] text-primary" />
                                <span className="font-medium">{country.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t('register.firstNames')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="firstName"
                          placeholder={t('register.firstNamesPlaceholder')}
                          className="h-12"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t('register.firstSurname')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="lastName"
                          placeholder={t('register.firstSurnamePlaceholder')}
                          className="h-12"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondLastName">
                          {t('register.secondSurname')}
                          {documentType === 'DNI' && <span className="text-destructive"> *</span>}
                          {documentType !== 'DNI' && <span className="text-muted-foreground text-xs ml-1">{t('register.optional')}</span>}
                        </Label>
                        <Input
                          id="secondLastName"
                          placeholder={t('register.secondSurnamePlaceholder')}
                          className="h-12"
                          value={secondLastName}
                          onChange={(e) => setSecondLastName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">{t('register.birthDate')} <span className="text-destructive">*</span></Label>
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
                            📅 {t('register.age')}: {age} {t('register.years')}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">{t('register.sex')} <span className="text-destructive">*</span></Label>
                        <Select value={sex} onValueChange={setSex}>
                          <SelectTrigger id="sex">
                            <SelectValue placeholder={t('register.select')} />
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
                          <Label htmlFor="relationship">{t('register.relationshipWithHolder')} <span className="text-destructive">*</span></Label>
                          <Select value={relationship} onValueChange={setRelationship}>
                            <SelectTrigger id="relationship">
                              <SelectValue placeholder={t('register.selectRelationship')} />
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
                            {t('register.minorRequiredRelationship')}
                          </p>
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
                      🏠 {t('register.residenceData')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="residenceCountry">{t('register.residenceCountry')} <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                          <Input
                            id="residenceCountry"
                            placeholder={t('register.searchCountry')}
                            className={`h-12 pl-10 pr-10 ${residenceCountryNotFound ? 'border-destructive' : ''}`}
                            value={residenceCountrySearch || countries.find(c => c.code === residenceCountry)?.name || ""}
                            onChange={(e) => {
                              setResidenceCountrySearch(e.target.value);
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
                        {filteredCountriesResidence.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 border-2 border-primary/30 rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
                            {filteredCountriesResidence.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
                                onClick={() => {
                                  setResidenceCountry(country.code);
                                  setResidenceCountrySearch(country.name);
                                  setFilteredCountriesResidence([]);
                                  setResidenceMunicipalityCode("");
                                  setResidenceMunicipalityName("");
                                  setResidencePostalCode("");
                                }}
                              >
                                <ChevronDown className="w-3 h-3 rotate-[-90deg] text-primary" />
                                <span className="font-medium">{country.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {residenceCountry === 'ES' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="municipalitySearch">{t('register.municipality')} <span className="text-destructive">*</span></Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                              <Input
                                id="municipalitySearch"
                                placeholder={t('register.searchMunicipality')}
                                className={`h-12 pl-10 pr-10 ${municipalityNotFound ? 'border-destructive' : ''}`}
                                value={municipalitySearch}
                                onChange={(e) => setMunicipalitySearch(e.target.value)}
                              />
                            </div>
                            {loadingMunicipalities && (
                              <p className="text-xs text-muted-foreground">{t('register.searching')}</p>
                            )}
                            {municipalities.length > 0 && (
                              <div className="absolute z-20 w-full mt-1 border-2 border-primary/30 rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
                                {municipalities.map((mun) => (
                                  <button
                                    key={mun.code}
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
                                    onClick={() => {
                                      setResidenceMunicipalityCode(mun.code);
                                      setResidenceMunicipalityName(mun.name);
                                      setResidencePostalCode(""); // Limpiar CP para que usuario seleccione
                                      setMunicipalitySearch(mun.display_name);
                                      setMunicipalities([]);
                                    }}
                                  >
                                    <ChevronDown className="w-3 h-3 rotate-[-90deg] text-primary" />
                                    <span className="font-medium">{mun.display_name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="residencePostalCode">{t('register.postalCode')} <span className="text-destructive">*</span></Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                              <Input
                                id="residencePostalCode"
                                placeholder={loadingPostalCodes ? t('register.loading') : t('register.selectPostalCode')}
                                className={`h-12 pl-10 pr-10 ${postalCodeNotFound ? 'border-destructive' : ''}`}
                                value={postalCodeSearch || residencePostalCode}
                                onChange={(e) => {
                                  setPostalCodeSearch(e.target.value);
                                  if (!e.target.value) {
                                    setResidencePostalCode("");
                                  }
                                }}
                                disabled={!residenceMunicipalityCode || loadingPostalCodes}
                              />
                            </div>
                            {filteredPostalCodes.length > 0 && postalCodeSearch && (
                              <div className="absolute z-20 w-full mt-1 border-2 border-primary/30 rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
                                <p className="text-xs text-muted-foreground px-4 py-2 bg-muted/50 border-b border-border sticky top-0">
                                  {filteredPostalCodes.length} {t('register.availablePostalCodes')}
                                </p>
                                {filteredPostalCodes.map((pc) => (
                                  <button
                                    key={pc.value}
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
                                    onClick={() => {
                                      setResidencePostalCode(pc.value);
                                      setPostalCodeSearch("");
                                      setFilteredPostalCodes([]);
                                    }}
                                  >
                                    <ChevronDown className="w-3 h-3 rotate-[-90deg] text-primary" />
                                    <span className="font-medium">{pc.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {!residenceMunicipalityCode
                                ? t('register.selectMunicipalityFirst')
                                : postalCodes.length > 0
                                  ? `${postalCodes.length} ${t('register.availablePostalCodes')}`
                                  : t('register.autoCompletesMunicipality')
                              }
                            </p>
                          </div>
                        </>
                      ) : residenceCountry ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="residenceMunicipalityName">{t('register.cityMunicipality')} <span className="text-destructive">*</span></Label>
                            <Input
                              id="residenceMunicipalityName"
                              placeholder={t('register.cityNamePlaceholder')}
                              className="h-12"
                              value={residenceMunicipalityName}
                              onChange={(e) => setResidenceMunicipalityName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="residencePostalCode">{t('register.postalCode')}</Label>
                            <Input
                              id="residencePostalCode"
                              placeholder={t('register.postalCodePlaceholder')}
                              className="h-12"
                              value={residencePostalCode}
                              onChange={(e) => setResidencePostalCode(e.target.value)}
                            />
                          </div>
                        </>
                      ) : null}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="residenceAddress">{t('register.fullAddress')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="residenceAddress"
                          placeholder={t('register.addressPlaceholder')}
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
                      📞 {t('register.contactInfo')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 ml-10">
                      <div className="space-y-2">
                        <Label htmlFor="phoneCountryCode">{t('register.countryCode')} <span className="text-destructive">*</span></Label>
                        <PhoneCountryCodeSelect
                          id="phoneCountryCode"
                          value={phoneCountryCode}
                          onChange={setPhoneCountryCode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('register.phoneNumber')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t('register.phonePlaceholder')}
                          className="h-12"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">{t('register.email')} <span className="text-destructive">*</span></Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('register.emailPlaceholder')}
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
                      {t('register.back')}
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
                    >
                      {t('register.continue')}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Info de guardado automático */}
              <div className="text-center text-sm text-muted-foreground">
                {t('register.autoSave')}
              </div>
            </div>
          )}
        </div>
      </main >

      {/* Barra flotante de acciones */}
      < FloatingActionBar />
    </div >
  );
};

export default Register;
