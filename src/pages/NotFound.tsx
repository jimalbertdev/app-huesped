import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservationParams } from "@/hooks/useReservationParams";
import { useLanguage } from "@/hooks/useLanguage";
import vacanflyLogo from "@/assets/vacanfly-logo.png";

const NotFound = () => {
  const location = useLocation();
  const { buildPathWithReservation } = useReservationParams();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <img src={vacanflyLogo} alt="Vacanfly" className="w-20" />

          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-8 animate-slide-up">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-breathing" />
              <div className="relative bg-card border-2 border-primary rounded-full p-8 shadow-elegant">
                <AlertCircle className="w-24 h-24 text-primary" />
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-primary">
              404
            </h1>
            <h2 className="text-3xl font-bold text-foreground">
              {t('notFound.title')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('notFound.message')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to={buildPathWithReservation("/")}>
              <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-primary hover:opacity-90">
                <Home className="w-4 h-4" />
                {t('notFound.goHome')}
              </Button>
            </Link>
            <Link to={buildPathWithReservation("/dashboard")}>
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                Ir al Dashboard
              </Button>
            </Link>
          </div>

          {/* Path info */}
          <div className="pt-8">
            <p className="text-sm text-muted-foreground">
              Ruta solicitada: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Vacanfly. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default NotFound;
