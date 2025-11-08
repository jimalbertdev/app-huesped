import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Share2, Copy, QrCode, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useReservationParams } from "@/hooks/useReservationParams";

const RegisterConfirmation = () => {
  const { toast } = useToast();
  const { buildPathWithReservation } = useReservationParams();
  const [allGuestsRegistered] = useState(false);
  
  const pendingGuests = [
    { name: "María García", status: "pending" },
    { name: "Carlos Rodríguez", status: "pending" },
  ];

  const registeredGuests = [
    { name: "Juan Pérez", status: "completed" },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/register");
    toast({
      title: "¡Enlace copiado!",
      description: "El enlace de registro se ha copiado al portapapeles",
    });
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent("Completa tu registro para nuestra estancia: " + window.location.origin + "/register");
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Icono de éxito */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 animate-scale-in">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">¡Registro Completo!</h1>
              <p className="text-lg text-muted-foreground">
                Gracias, <span className="text-foreground font-semibold">Juan Pérez</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Tu información ha sido guardada correctamente
              </p>
            </div>
          </div>

          {/* Estado del grupo */}
          <Card className="p-6 shadow-elegant">
            <h3 className="text-lg font-semibold mb-4">Estado del Grupo</h3>
            
            {/* Huéspedes registrados */}
            <div className="space-y-3 mb-4">
              {registeredGuests.map((guest, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-success font-medium">{guest.name}</span>
                  <span className="ml-auto text-xs text-success">Registrado</span>
                </div>
              ))}

              {/* Huéspedes pendientes */}
              {pendingGuests.map((guest, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span className="text-muted-foreground">{guest.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Pendiente</span>
                </div>
              ))}
            </div>

            {/* Contador */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium">
                Faltan <span className="text-primary text-lg font-bold">{pendingGuests.length}</span> huéspedes por registrar
              </p>
            </div>
          </Card>

          {allGuestsRegistered ? (
            /* Todos registrados */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center p-6 bg-gradient-primary rounded-xl text-white">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-xl font-bold mb-2">
                  ¡Todos los huéspedes registrados!
                </h2>
                <p className="text-sm opacity-90">
                  Acceso completo desbloqueado
                </p>
              </div>

              <Link to={buildPathWithReservation("/dashboard")}>
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-lg h-14"
                >
                  Ir a Mi Estancia →
                </Button>
              </Link>
            </div>
          ) : (
            /* Faltan huéspedes */
            <div className="space-y-4">
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold mb-4">Compartir Registro</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Envía este enlace a los demás huéspedes para que completen su registro
                </p>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-5 h-5" />
                    Copiar enlace de registro
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={handleShareWhatsApp}
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir por WhatsApp
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                  >
                    <Mail className="w-5 h-5" />
                    Enviar por Email
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                  >
                    <QrCode className="w-5 h-5" />
                    Mostrar código QR
                  </Button>
                </div>
              </Card>

              <Link to={buildPathWithReservation("/dashboard")}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Continuar a la app
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground">
                Algunas funciones estarán limitadas hasta que todos los huéspedes completen su registro
              </p>
            </div>
          )}

          {/* Info adicional */}
          <div className="text-center text-sm text-muted-foreground">
            💾 Tu progreso se ha guardado correctamente
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterConfirmation;
