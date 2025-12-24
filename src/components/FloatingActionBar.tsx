import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservation } from "@/hooks/useReservation";

export const FloatingActionBar = () => {
    const { t } = useLanguage();
    const { reservationData } = useReservation();
    const [showContactDialog, setShowContactDialog] = useState(false);
    const [showSuperHost, setShowSuperHost] = useState(false);

    const hostName = reservationData?.host_name || '?';
    const hostPhone = reservationData?.host_phone || '?';
    const hostEmail = reservationData?.host_email || '?';
    const hostPhotoUrl = reservationData?.host_photo_url;

    const superHostName = reservationData?.super_host_name;
    const superHostPhone = reservationData?.super_host_phone;
    const superHostEmail = reservationData?.super_host_email;
    const superHostPhotoUrl = reservationData?.super_host_photo_url;

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
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3 h-12 border-border hover:bg-muted/50"
                                    onClick={() => window.location.href = `mailto:${hostEmail}`}
                                >
                                    <Mail className="w-4 h-4 text-primary" />
                                    <span className="font-medium truncate">{hostEmail}</span>
                                </Button>
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
                                            {superHostEmail && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start gap-3 h-10 bg-background/50 border-border/40 hover:bg-background"
                                                    onClick={() => window.location.href = `mailto:${superHostEmail}`}
                                                >
                                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-xs font-medium truncate">{superHostEmail}</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Espaciador para evitar que el contenido quede oculto detrás de la barra */}
            <div className="h-16" />
        </>
    );
};

export default FloatingActionBar;
