import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Share2, Copy, QrCode, Mail, User, UserPlus, Globe, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useReservation } from "@/hooks/useReservation";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import vacanflyLogo from "@/assets/vacanfly-logo.png";
import { ShareDialog } from "@/components/ShareDialog";
import { LanguageSelector } from "@/components/LanguageSelector";

const RegisterConfirmation = () => {
  const { toast } = useToast();
  const { buildPathWithReservation } = useReservationParams();
  const { reservationData, guests } = useReservation();
  const { language, setLanguage, t, getLanguageName } = useLanguage();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showSuperHost, setShowSuperHost] = useState(false);

  // Obtener el total de huéspedes esperados
  const totalGuests = reservationData?.total_guests || 0;
  const registeredCount = guests.length;
  const allGuestsRegistered = totalGuests > 0 && registeredCount >= totalGuests;

  // Datos del anfitrión
  const hostName = reservationData?.host_name || '?';
  const hostPhone = reservationData?.host_phone || '?';
  const hostEmail = reservationData?.host_email || '?';
  const hostPhotoUrl = reservationData?.host_photo_url;
  const superHostName = reservationData?.super_host_name;
  const superHostPhone = reservationData?.super_host_phone;
  const superHostEmail = reservationData?.super_host_email;
  const superHostPhotoUrl = reservationData?.super_host_photo_url;

  // Crear lista completa de huéspedes (registrados + placeholders para los que faltan)
  const guestSlots = [];

  // Agregar huéspedes registrados
  guests.forEach(guest => {
    guestSlots.push({
      type: 'registered',
      isResponsible: guest.is_responsible === 1 || guest.is_responsible === true,
      firstName: guest.first_name,
      lastName: guest.last_name,
      fullName: `${guest.first_name} ${guest.last_name}`,
    });
  });

  // Agregar placeholders para huéspedes faltantes
  const missingCount = totalGuests - registeredCount;
  for (let i = 0; i < missingCount; i++) {
    guestSlots.push({
      type: 'pending',
      isResponsible: false,
      fullName: `Huésped ${i + 1}`,
    });
  }

  // Obtener el último huésped registrado (el que acaba de completar el registro)
  const lastRegisteredGuest = guests.length > 0 ? guests[guests.length - 1] : null;
  const currentGuestName = lastRegisteredGuest
    ? `${lastRegisteredGuest.first_name} ${lastRegisteredGuest.last_name}`
    : 'Huésped';

  const handleCopyLink = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    navigator.clipboard.writeText(url);
    toast({
      title: t('share.copied'),
      duration: 2000,
    });
  };

  const handleShareWhatsApp = () => {
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
    console.log(subject, body);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Icono de éxito */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 animate-scale-in">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('confirmation.title')}</h1>
              <p className="text-lg text-muted-foreground">
                {t('confirmation.thankYou')}, <span className="text-foreground font-semibold">{currentGuestName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t('confirmation.dataSaved')}
              </p>
            </div>
          </div>

          {/* Estado del grupo */}
          <Card className="p-6 shadow-elegant">
            <h3 className="text-lg font-semibold mb-4">
              {t('confirmation.groupStatus')} ({registeredCount} {t('confirmation.of')} {totalGuests})
            </h3>

            {/* Lista de huéspedes */}
            <div className="space-y-3 mb-4">
              {guestSlots.map((slot, index) => {
                if (slot.type === 'registered') {
                  // Huésped registrado
                  if (slot.isResponsible) {
                    // Responsable - Color azul
                    return (
                      <div
                        key={`guest-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500/50"
                      >
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 dark:text-blue-300 font-semibold">
                              {slot.fullName}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                              {t('confirmation.responsible')}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">{t('confirmation.registered')}</span>
                      </div>
                    );
                  } else {
                    // Huésped normal - Color verde
                    return (
                      <div
                        key={`guest-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20"
                      >
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-success font-medium">{slot.fullName}</span>
                        <span className="ml-auto text-xs text-success">{t('confirmation.registered')}</span>
                      </div>
                    );
                  }
                } else {
                  // Huésped pendiente - Color gris pero clickable
                  return (
                    <Link
                      key={`pending-${index}`}
                      to={buildPathWithReservation("/register")}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer">
                        <User className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-muted-foreground italic">{slot.fullName}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{t('confirmation.pending')}</span>
                      </div>
                    </Link>
                  );
                }
              })}
            </div>

            {/* Botón para registrar más huéspedes */}
            {missingCount > 0 && (
              <Link to={buildPathWithReservation("/register")}>
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-primary hover:opacity-90 h-14"
                >
                  <UserPlus className="w-5 h-5" />
                  {t('confirmation.registerNext')}
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                    {missingCount} {missingCount !== 1 ? t('confirmation.pendingPlural') : t('confirmation.pendingSingular')}
                  </span>
                </Button>
              </Link>
            )}

            {missingCount === 0 && totalGuests > 0 && (
              <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm font-semibold text-success">
                  ✓ {t('confirmation.allRegistered')}
                </p>
              </div>
            )}
          </Card>

          {allGuestsRegistered ? (
            /* Todos registrados */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center p-8 bg-yellow-50/80 dark:bg-yellow-950/30 rounded-xl border-2 border-yellow-500/50">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold mb-2 text-yellow-700 dark:text-yellow-300">
                  {t('confirmation.allGuestsComplete')}
                </h2>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t('confirmation.fullAccessUnlocked')}
                </p>
              </div>

              <div className="pt-4">
                <Link to={buildPathWithReservation("/dashboard")}>
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-success hover:bg-success/90 text-white text-lg h-14 shadow-lg"
                  >
                    {t('confirmation.goToDashboard')} →
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Faltan huéspedes */
            <div className="space-y-6">
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold mb-4">{t('confirmation.shareRegistration')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('confirmation.shareDescription')}
                </p>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-5 h-5" />
                    {t('confirmation.copyLink')}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleShareWhatsApp}
                  >
                    <Share2 className="w-5 h-5" />
                    {t('confirmation.shareWhatsApp')}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleEmail}
                  >
                    <Mail className="w-5 h-5" />
                    {t('confirmation.shareEmail')}
                  </Button>

                </div>
              </Card>

              <div className="pt-2">
                <Link to={buildPathWithReservation("/dashboard")}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    {t('confirmation.continueToApp')}
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {t('confirmation.limitedFeatures')}
              </p>
            </div>
          )}

          {/* Info adicional */}
          <div className="text-center text-sm text-muted-foreground">
            💾 {t('confirmation.progressSaved')}
          </div>
        </div>
      </main>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={(open) => {
        setShowContactDialog(open);
        if (!open) setShowSuperHost(false);
      }}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('contact.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Primary Host */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {hostPhotoUrl ? (
                  <img
                    src={hostPhotoUrl}
                    alt={hostName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">{hostName}</p>
                  <p className="text-xs text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                    {t('contact.available')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-border hover:bg-muted/50"
                  onClick={() => window.location.href = `tel:${hostPhone}`}
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-medium">{hostPhone}</span>
                </Button>
                {/* <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-border hover:bg-muted/50"
                  onClick={() => window.location.href = `mailto:${hostEmail}`}
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate">{hostEmail}</span>
                </Button> */}
              </div>
            </div>

            {/* Super Host Accordion Trigger */}
            {superHostName && (
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => setShowSuperHost(!showSuperHost)}
                  className="w-full flex items-center justify-between py-2 text-sm text-primary font-medium hover:underline group"
                >
                  <span className="text-left leading-tight">{t('contact.problemQuestion')}</span>
                  {showSuperHost ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                </button>

                {/* Collapsible Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSuperHost ? 'max-height-[500px] opacity-100 mt-4' : 'max-height-0 opacity-0'}`}>
                  <div className="bg-muted/40 rounded-2xl p-4 space-y-4 border border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {t('contact.superHostMessage').replace('{hostName}', hostName)}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      {superHostPhotoUrl ? (
                        <img
                          src={superHostPhotoUrl}
                          alt={superHostName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl shadow-sm">
                          👤
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm">{superHostName}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          {t('contact.superHostTitle')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {superHostPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-3 h-10 bg-background/50 border-border/40 hover:bg-background"
                          onClick={() => window.location.href = `tel:${superHostPhone}`}
                        >
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{superHostPhone}</span>
                        </Button>
                      )}
                      {/* {superHostEmail && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-3 h-10 bg-background/50 border-border/40 hover:bg-background"
                          onClick={() => window.location.href = `mailto:${superHostEmail}`}
                        >
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium truncate">{superHostEmail}</span>
                        </Button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterConfirmation;
