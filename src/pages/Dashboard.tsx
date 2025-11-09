import { useState, useEffect } from "react";
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
  Globe,
  Menu,
  Unlock,
  Bed,
  Clock,
  MessageSquare,
  Plus,
  Minus,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { preferenceService, handleApiError } from "@/services/api";
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

const Dashboard = () => {
  const { language, setLanguage, t, getLanguageName } = useLanguage();
  const { reservationData, loading, error, guests } = useReservation();
  const { buildPathWithReservation } = useReservationParams();
  const { toast } = useToast();
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Obtener contrato del huésped responsable
  const responsibleGuest = guests.find(g => g.is_responsible === 1 || g.is_responsible === true);
  const contractPath = responsibleGuest?.contract_path;

  // Obtener datos de la reserva - Sin valores por defecto, mostrar '?' si no hay datos
  const totalGuests = reservationData?.total_guests || 0;
  const registeredGuests = reservationData?.registered_guests || 0;
  const reservationCode = reservationData?.reservation_code || '?';
  const checkInDate = reservationData?.check_in_date || '?';
  const checkInTime = reservationData?.check_in_time || '?';
  const checkOutDate = reservationData?.check_out_date || '?';
  const checkOutTime = reservationData?.check_out_time || '?';
  const hostName = reservationData?.host_name || '?';
  const hostPhone = reservationData?.host_phone || '?';
  const hostEmail = reservationData?.host_email || '?';
  const accommodationName = reservationData?.accommodation_name || '?';

  const [isRegistered] = useState(true);
  const allGuestsRegistered = totalGuests > 0 && registeredGuests === totalGuests;
  const hasResponsibleGuest = guests.some(guest => guest.is_responsible);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentType, setIncidentType] = useState<"complaint" | "suggestion">("complaint");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDoor, setSelectedDoor] = useState<"portal" | "accommodation" | null>(null);
  const [countdown, setCountdown] = useState(4);
  
  // Historial de aperturas simulado
  const [unlockHistory, setUnlockHistory] = useState([
    { time: "14:30", date: "2024-11-05", door: "Portal", success: true },
    { time: "12:15", date: "2024-11-05", door: "Alojamiento", success: false },
    { time: "18:45", date: "2024-11-04", door: "Portal", success: true },
    { time: "16:20", date: "2024-11-04", door: "Portal", success: true },
  ]);
  
  // Preferences state
  const [needsCrib, setNeedsCrib] = useState(false);
  const [doubleBeds, setDoubleBeds] = useState(0);
  const [singleBeds, setSingleBeds] = useState(0);
  const [sofaBeds, setSofaBeds] = useState(0);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Cargar preferencias cuando se carga la reserva
  useEffect(() => {
    const loadPreferences = async () => {
      if (!reservationData?.id || preferencesLoaded) return;

      try {
        const response = await preferenceService.get(reservationData.id);
        const preferences = response.data.data;

        if (preferences) {
          setNeedsCrib(preferences.needs_crib || false);
          setDoubleBeds(preferences.double_beds || 0);
          setSingleBeds(preferences.single_beds || 0);
          setSofaBeds(preferences.sofa_beds || 0);
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

  // Contador para confirmación de apertura
  useEffect(() => {
    if (showConfirmDialog && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmDialog, countdown]);

  const handleOpenDoorClick = (doorType: "portal" | "accommodation") => {
    setSelectedDoor(doorType);
    setCountdown(4);
    setShowConfirmDialog(true);
  };

  const handleConfirmOpen = () => {
    if (selectedDoor && countdown === 0) {
      const doorName = selectedDoor === "portal" ? "Portal" : "Alojamiento";
      const success = Math.random() > 0.3; // 70% success rate simulation
      const newEntry = {
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        door: doorName,
        success: success
      };
      setUnlockHistory([newEntry, ...unlockHistory]);
      setShowConfirmDialog(false);
      setShowUnlockDialog(true);
    }
  };

  const handleCancelOpen = () => {
    setShowConfirmDialog(false);
    setSelectedDoor(null);
    setCountdown(4);
  };

  const handleOpenDoor = (doorType: "portal" | "accommodation") => {
    const doorName = doorType === "portal" ? "Portal" : "Alojamiento";
    const success = Math.random() > 0.3; // 70% success rate simulation
    const newEntry = {
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      door: doorName,
      success: success
    };
    setUnlockHistory([newEntry, ...unlockHistory]);
    setShowUnlockDialog(true);
  };

  const handleSubmitIncident = () => {
    console.log("Incident submitted:", { type: incidentType, description: incidentDescription });
    setShowIncidentDialog(false);
    setIncidentDescription("");
    setIncidentType("complaint");
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

    try {
      await preferenceService.save({
        reservation_id: reservationData.id,
        needs_crib: needsCrib,
        double_beds: doubleBeds,
        single_beds: singleBeds,
        sofa_beds: sofaBeds,
        estimated_arrival_time: estimatedArrivalTime || undefined,
        additional_info: additionalInfo || undefined,
      });

      toast({
        title: "¡Preferencias actualizadas!",
        description: "Tus preferencias han sido guardadas correctamente.",
        variant: "success",
      });

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
          className="h-10 w-10"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="w-12 text-center font-semibold">{value}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const localGuideCategories = [
    {
      id: 'restaurants',
      title: t('localGuide.restaurants'),
      items: [
        { name: 'La Terraza del Mar', description: 'Cocina mediterránea con vistas al mar', distance: '500m', rating: '4.8⭐' },
        { name: 'El Rincón Tradicional', description: 'Tapas y platos típicos españoles', distance: '300m', rating: '4.6⭐' },
        { name: 'Pizzería Bella Napoli', description: 'Auténtica pizza italiana', distance: '700m', rating: '4.7⭐' },
      ]
    },
    {
      id: 'cafes',
      title: t('localGuide.cafes'),
      items: [
        { name: 'Café Central', description: 'Café de especialidad y repostería', distance: '200m', rating: '4.5⭐' },
        { name: 'La Bohème', description: 'Ambiente acogedor, wifi gratis', distance: '400m', rating: '4.4⭐' },
      ]
    },
    {
      id: 'supermarkets',
      title: t('localGuide.supermarkets'),
      items: [
        { name: 'Mercadona', description: 'Supermercado de confianza', distance: '600m', rating: '4.2⭐' },
        { name: 'Carrefour Express', description: 'Abierto hasta las 22:00', distance: '350m', rating: '4.0⭐' },
      ]
    },
    {
      id: 'transport',
      title: t('localGuide.transport'),
      items: [
        { name: 'Estación de Metro L3', description: 'Acceso directo al centro', distance: '800m', rating: '' },
        { name: 'Parada de Bus 24/7', description: 'Líneas 15, 42, 87', distance: '150m', rating: '' },
      ]
    },
    {
      id: 'tourist',
      title: t('localGuide.tourist'),
      items: [
        { name: 'Mirador Vista Hermosa', description: 'Vistas panorámicas de la ciudad', distance: '1.2km', rating: '4.9⭐' },
        { name: 'Museo de Arte Moderno', description: 'Exposiciones contemporáneas', distance: '2km', rating: '4.7⭐' },
        { name: 'Playa del Sol', description: 'Arena dorada y aguas cristalinas', distance: '3km', rating: '4.8⭐' },
      ]
    },
    {
      id: 'emergency',
      title: t('localGuide.emergency'),
      items: [
        { name: 'Hospital General', description: 'Urgencias 24h: +34 112', distance: '2.5km', rating: '' },
        { name: 'Farmacia 24h', description: 'Servicio nocturno disponible', distance: '400m', rating: '' },
        { name: 'Policía Local', description: 'Emergencias: 112', distance: '1km', rating: '' },
      ]
    },
    {
      id: 'entertainment',
      title: t('localGuide.entertainment'),
      items: [
        { name: 'Cinema Multiplex', description: 'Últimos estrenos', distance: '1.5km', rating: '4.3⭐' },
        { name: 'Teatro Municipal', description: 'Espectáculos en vivo', distance: '2.2km', rating: '4.6⭐' },
        { name: 'Club Nocturno Luna', description: 'Música en vivo los fines de semana', distance: '1.8km', rating: '4.4⭐' },
      ]
    },
  ];

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
            <Globe className="w-5 h-5 text-muted-foreground" />
            <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
              <SelectTrigger className="w-[140px] border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{getLanguageName('es')}</SelectItem>
                <SelectItem value="en">{getLanguageName('en')}</SelectItem>
                <SelectItem value="ca">{getLanguageName('ca')}</SelectItem>
                <SelectItem value="fr">{getLanguageName('fr')}</SelectItem>
                <SelectItem value="de">{getLanguageName('de')}</SelectItem>
                <SelectItem value="nl">{getLanguageName('nl')}</SelectItem>
              </SelectContent>
            </Select>
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
                      : t('dashboard.completeToUnlock')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {isRegistered
                      ? t('dashboard.someFeaturesLimited')
                      : "Necesitas completar tu registro para acceder a todas las funcionalidades"}
                  </p>
                  <Link to={buildPathWithReservation(isRegistered ? "/" : "/register")}>
                    <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                      {isRegistered ? t('welcome.share') : t('welcome.completeRegistration')}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Grid de cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Mi Reserva */}
          <Card
            className={`p-6 shadow-card hover-lift ${
              !hasResponsibleGuest ? "relative overflow-hidden" : ""
            }`}
          >
            {!hasResponsibleGuest && (
              <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{t('dashboard.completeToUnlock')}</p>
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
                <div>
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <span className="font-mono font-semibold">{reservationCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-in:</span>{" "}
                  <span className="font-semibold">{checkInDate}, {checkInTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>{" "}
                  <span className="font-semibold">{checkOutDate}, {checkOutTime}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2 bg-gradient-primary hover:opacity-90"
                    disabled={!allGuestsRegistered}
                    onClick={() => handleOpenDoorClick("portal")}
                  >
                    <Unlock className="w-4 h-4" />
                    Abrir Portal
                  </Button>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    disabled={!allGuestsRegistered}
                    onClick={() => handleOpenDoorClick("accommodation")}
                  >
                    <Unlock className="w-4 h-4" />
                    Abrir Alojamiento
                  </Button>
                </div>
                
                {/* Ver Historial de Aperturas */}
                <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setShowUnlockDialog(true)}
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
                      {unlockHistory.map((entry, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            entry.success
                              ? 'bg-success/10 border border-success/20'
                              : 'bg-destructive/10 border border-destructive/20'
                          }`}
                        >
                          <div>
                            <p className={`font-semibold ${entry.success ? 'text-success' : 'text-destructive'}`}>
                              {entry.door}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.date} a las {entry.time}
                            </p>
                          </div>
                          <span className={`text-2xl ${entry.success ? 'text-success' : 'text-destructive'}`}>
                            {entry.success ? '✓' : '✗'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Descargar Contrato */}
                {contractPath && (
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost.local'}${contractPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button
                      variant="outline"
                      className="w-full text-xs gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Descargar Contrato PDF
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Card 2: Preferencias de Estancia */}
          <Card
            className={`p-6 shadow-card hover-lift ${
              !hasResponsibleGuest ? "relative overflow-hidden" : ""
            }`}
          >
            {!hasResponsibleGuest && (
              <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{t('dashboard.completeToUnlock')}</p>
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
                    <span>Llegada: {estimatedArrivalTime}</span>
                  </div>
                )}
                {(doubleBeds > 0 || singleBeds > 0 || sofaBeds > 0) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bed className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {doubleBeds > 0 && `${doubleBeds} ${doubleBeds === 1 ? 'cama doble' : 'camas dobles'}`}
                      {doubleBeds > 0 && (singleBeds > 0 || sofaBeds > 0) && ', '}
                      {singleBeds > 0 && `${singleBeds} ${singleBeds === 1 ? 'cama individual' : 'camas individuales'}`}
                      {singleBeds > 0 && sofaBeds > 0 && ', '}
                      {sofaBeds > 0 && `${sofaBeds} sofá${sofaBeds === 1 ? '' : 's'} cama`}
                    </span>
                  </div>
                )}
                {needsCrib && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🛏️</span>
                    <span>Cuna solicitada</span>
                  </div>
                )}
                {!estimatedArrivalTime && !doubleBeds && !singleBeds && !sofaBeds && !needsCrib && (
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
                  Editar Preferencias
                </Button>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Actualizar Preferencias de Estancia</DialogTitle>
                    <DialogDescription>
                      Modifica los detalles de tu alojamiento
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Hora de llegada */}
                    <div className="space-y-2">
                      <Label htmlFor="arrivalTime">Hora de Llegada Estimada</Label>
                      <Input
                        id="arrivalTime"
                        type="time"
                        value={estimatedArrivalTime}
                        onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        Nos ayuda a preparar tu alojamiento
                      </p>
                    </div>

                    {/* Necesita cuna */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
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
                    <div className="space-y-3">
                      <h4 className="font-semibold">Configuración de Camas</h4>
                      <div className="grid grid-cols-3 gap-4">
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
                      <Label htmlFor="additionalInfo">Información Adicional (Opcional)</Label>
                      <Textarea
                        id="additionalInfo"
                        placeholder="Alergias, peticiones especiales, comentarios..."
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {additionalInfo.length}/500 caracteres
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPreferencesDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdatePreferences} className="bg-gradient-primary hover:opacity-90">
                      Guardar Cambios
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
                <div className="w-14 h-14 rounded-full bg-gradient-secondary flex items-center justify-center text-2xl">
                  👤
                </div>
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
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => window.location.href = `mailto:${hostEmail}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {hostEmail}
                </Button>
              </div>
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
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-to-arrive">
                  <AccordionTrigger className="text-sm">🗺️ ¿Cómo llegar?</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p>Desde el aeropuerto: Toma el metro línea 3 hasta la estación Central (30 min)</p>
                    <p>En coche: Parking disponible en calle lateral</p>
                    <p>Código de acceso al edificio: 1234#</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="amenities">
                  <AccordionTrigger className="text-sm">🏡 ¿Qué hay aquí?</AccordionTrigger>
                  <AccordionContent className="text-sm">
                    WiFi, Cocina completa, TV Smart, Aire acondicionado, Calefacción, Secador, Plancha, Lavadora
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-it-works">
                  <AccordionTrigger className="text-sm">🔧 ¿Cómo funciona?</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p><strong>WiFi:</strong> Red: CasaVH | Contraseña: hermosa2024</p>
                    <p><strong>Calefacción:</strong> Panel táctil en salón, temperatura recomendada 21°C</p>
                    <p><strong>TV:</strong> Netflix y Prime Video ya configurados</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="rules">
                  <AccordionTrigger className="text-sm">📋 Normas</AccordionTrigger>
                  <AccordionContent className="space-y-1 text-sm">
                    <p>• Check-in: 15:00 - Check-out: 11:00</p>
                    <p>• No fumar en el interior</p>
                    <p>• No fiestas ni eventos</p>
                    <p>• Respetar el silencio 22:00-08:00</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
              <div className="space-y-3">
                <a 
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      Tour Virtual del Alojamiento
                    </p>
                    <p className="text-xs text-muted-foreground">Ver en YouTube</p>
                  </div>
                </a>
                <a 
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      Cómo Usar las Amenidades
                    </p>
                    <p className="text-xs text-muted-foreground">Ver en YouTube</p>
                  </div>
                </a>
                <a 
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      Guía de la Zona y Lugares de Interés
                    </p>
                    <p className="text-xs text-muted-foreground">Ver en YouTube</p>
                  </div>
                </a>
              </div>
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
              <Accordion type="single" collapsible className="w-full">
                {localGuideCategories.map((category) => (
                  <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger className="text-sm">{category.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {category.items.map((item, idx) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded-lg space-y-1">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-xs">{item.name}</p>
                              {item.rating && <span className="text-xs">{item.rating}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <p className="text-xs text-primary font-medium">📍 {item.distance}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="gap-2">
                  <Phone className="w-4 h-4" />
                  Emergencias: 112
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowIncidentDialog(true)}
                >
                  <MessageSquare className="w-4 h-4" />
                  Sugerencias o Quejas
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.location.href = `tel:${hostPhone}`}
                >
                  <Mail className="w-4 h-4" />
                  {hostPhone}
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
            <DialogTitle>Sugerencias o Quejas</DialogTitle>
            <DialogDescription>
              Tu opinión nos ayuda a mejorar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="incident-type-main">Tipo</Label>
              <Select value={incidentType} onValueChange={(value) => setIncidentType(value as "complaint" | "suggestion")}>
                <SelectTrigger id="incident-type-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">Queja</SelectItem>
                  <SelectItem value="suggestion">Sugerencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="incident-description-main">Descripción</Label>
              <Textarea
                id="incident-description-main"
                placeholder="Describe tu sugerencia o queja..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncidentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitIncident} className="bg-gradient-primary hover:opacity-90">
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de apertura */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
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
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Confirmar en (${countdown})` : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contact.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <p className="font-semibold">{hostName}</p>
                <p className="text-sm text-muted-foreground">{t('contact.available')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.location.href = `tel:${hostPhone}`}
              >
                <Phone className="w-4 h-4" />
                {hostPhone}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.location.href = `mailto:${hostEmail}`}
              >
                📧 {hostEmail}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
