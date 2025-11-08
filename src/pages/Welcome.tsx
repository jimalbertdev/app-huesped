import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Globe, Phone, Share2, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const Welcome = () => {
  const { language, setLanguage, t, getLanguageName } = useLanguage();
  const { reservationData, loading, error, guests } = useReservation();
  const { buildPathWithReservation, getReservationQueryString } = useReservationParams();
  const navigate = useNavigate();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Obtener datos de la reserva - Sin valores por defecto, mostrar '?' si no hay datos
  const totalGuests = reservationData?.total_guests || 0;
  const registeredGuests = reservationData?.registered_guests || 0;
  const accommodationName = reservationData?.accommodation_name || '?';
  const hostName = reservationData?.host_name || '?';
  const hostPhone = reservationData?.host_phone || '?';
  const hostEmail = reservationData?.host_email || '?';
  const hasResponsibleGuest = guests.some(guest => guest.is_responsible);

  const handleCopyLink = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    navigator.clipboard.writeText(url);
    toast({
      title: t('share.copied'),
      duration: 2000,
    });
  };

  const handleWhatsApp = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    const message = encodeURIComponent(`${t('share.message')}: ${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    const subject = encodeURIComponent(t('share.message'));
    const body = encodeURIComponent(`${t('share.message')}: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Si está cargando, mostrar loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero animate-fade-in flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando información de la reserva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero animate-fade-in">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl space-y-8 animate-slide-up">
          {/* Logo y bienvenida */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-primary rounded-3xl flex items-center justify-center shadow-elegant">
              <span className="text-4xl">🏠</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {accommodationName}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('welcome.subtitle')}
            </p>
          </div>

          {/* Card principal */}
          <Card className="p-8 shadow-elegant hover-lift">
            <div className="space-y-6">
              {/* Progreso de huéspedes */}
              {totalGuests > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-4">
                    <Users className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{t('welcome.guestsRegistered')}</span>
                        <span className="text-sm font-bold">
                          {registeredGuests}/{totalGuests}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary transition-all duration-500"
                          style={{ width: `${totalGuests > 0 ? (registeredGuests / totalGuests) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Iconos de huéspedes */}
                  <div className="flex justify-center gap-3">
                    {Array.from({ length: totalGuests }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          i < registeredGuests
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i < registeredGuests ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Users className="w-6 h-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    {reservationData ? 'Cargando información de huéspedes...' : 'Proporciona un código de reserva en la URL para ver los detalles'}
                  </p>
                </div>
              )}

              {/* Mensaje motivador */}
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  {t('welcome.timeEstimate')}
                </p>
              </div>

              {/* CTA Principal */}
              <Link to={buildPathWithReservation("/register")}>
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 animate-breathing gap-2"
                >
                  {t('welcome.completeRegistration')}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              {/* Barra de progreso */}
              <div className="text-center">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {t('welcome.step')}
                </span>
              </div>
            </div>
          </Card>

          {/* Acciones secundarias */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4" />
              {t('welcome.share')}
            </Button>
            {/* Solo mostrar "Ver Alojamiento" si hay un huésped responsable registrado */}
            {hasResponsibleGuest && (
              <Link to={buildPathWithReservation("/dashboard")}>
                <Button variant="ghost" className="w-full sm:w-auto">
                  {t('welcome.viewAccommodation')}
                </Button>
              </Link>
            )}
          </div>

          {/* Footer info */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>{t('welcome.dataProtected')}</p>
            <p>{t('welcome.compliance')}</p>
          </div>
        </div>
      </main>

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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('share.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleCopyLink}
            >
              📋 {t('share.copy')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleWhatsApp}
            >
              💬 {t('share.whatsapp')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleEmail}
            >
              📧 {t('share.email')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Welcome;
