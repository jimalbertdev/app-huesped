import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Phone, Share2, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservation } from "@/hooks/useReservation";
import { useReservationParams } from "@/hooks/useReservationParams";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import vacanflyLogo from "@/assets/vacanfly-logo.png";
import { ShareDialog } from "@/components/ShareDialog";
import { LanguageSelector } from "@/components/LanguageSelector";

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
  const hostPhotoUrl = reservationData?.host_photo_url;
  const hasResponsibleGuest = guests.some(guest => guest.is_responsible);
  const allGuestsRegistered = totalGuests > 0 && registeredGuests >= totalGuests;

  // Debug: Log host photo URL
  useEffect(() => {
    if (reservationData) {
      console.log('🖼️ Host Photo URL:', hostPhotoUrl);
      console.log('📸 Host Photo:', reservationData.host_photo);
      console.log('🆔 Host Document:', reservationData.host_document);
    }
  }, [reservationData, hostPhotoUrl]);

  // Funciones de compartir movidas a ShareDialog component

  // Redirección a 404 si hay error al cargar la reserva
  useEffect(() => {
    if (error) {
      navigate('/404', { replace: true });
    }
  }, [error, navigate]);

  // Redirección automática al dashboard si todos los huéspedes están registrados
  useEffect(() => {
    if (allGuestsRegistered && totalGuests > 0) {
      navigate(buildPathWithReservation('/dashboard'));
    }
  }, [allGuestsRegistered, totalGuests, navigate, buildPathWithReservation]);

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
            <LanguageSelector />
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
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${i < registeredGuests
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

              {allGuestsRegistered ? (
                /* Todos registrados - Mostrar acceso completo */
                <>
                  <div className="text-center p-8 bg-yellow-50/80 dark:bg-yellow-950/30 rounded-xl border-2 border-yellow-500/50">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-700 dark:text-yellow-300">
                      {t('confirmation.allGuestsComplete')}
                    </h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      {t('confirmation.fullAccessUnlocked')}
                    </p>
                  </div>

                  <div className="pt-6">
                    <Link to={buildPathWithReservation("/dashboard")}>
                      <Button
                        size="lg"
                        className="w-full h-14 text-lg font-semibold bg-success hover:bg-success/90 text-white shadow-lg gap-2"
                      >
                        {t('confirmation.goToDashboard')}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                /* Faltan huéspedes - Mostrar botón de registro */
                <>
                  {/* Mensaje motivador */}
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      {t('welcome.timeEstimate')}
                    </p>
                  </div>

                  {/* CTA Principal */}
                  <div className="pt-2">
                    <Link to={buildPathWithReservation("/register")}>
                      <Button
                        size="lg"
                        className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 animate-breathing gap-2"
                      >
                        {t('welcome.completeRegistration')}
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Barra de progreso */}
                  <div className="text-center pt-2">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {t('welcome.step')}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Acciones secundarias */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!allGuestsRegistered && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="w-4 h-4" />
                {t('welcome.share')}
              </Button>
            )}
            {/* Solo mostrar "Ver Alojamiento" si hay un huésped responsable registrado pero NO todos */}
            {hasResponsibleGuest && !allGuestsRegistered && (
              <Link to={buildPathWithReservation("/dashboard")}>
                <Button variant="ghost" className="bg-gradient-primary hover:opacity-90 animate-breathing gap-2 w-full sm:w-auto mt-4">
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
              {hostPhotoUrl ? (
                <img
                  src={hostPhotoUrl}
                  alt={hostName}
                  className="w-16 h-16 rounded-full object-cover bg-primary/10"
                  onError={(e) => {
                    // Si la imagen falla, ocultar y mostrar fallback
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              {!hostPhotoUrl && (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
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
      <ShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} />
    </div>
  );
};

export default Welcome;
