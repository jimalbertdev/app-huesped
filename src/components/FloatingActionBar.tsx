import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservation } from "@/hooks/useReservation";

export const FloatingActionBar = () => {
    const { t } = useLanguage();
    const { reservationData } = useReservation();
    const [showContactDialog, setShowContactDialog] = useState(false);

    const hostName = reservationData?.host_name || '?';
    const hostPhone = reservationData?.host_phone || '?';
    const hostEmail = reservationData?.host_email || '?';

    return (
        <>
            {/* Barra flotante inferior */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
                <div className="container mx-auto px-4 h-16 flex items-center justify-center gap-3">
                    <LanguageSelector />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowContactDialog(true)}
                    >
                        <Phone className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('welcome.contact')}</span>
                    </Button>
                </div>
            </div>

            {/* Dialog de contacto */}
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

            {/* Espaciador para evitar que el contenido quede oculto detrás de la barra */}
            <div className="h-16" />
        </>
    );
};

export default FloatingActionBar;
