import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./hooks/useLanguage";
import { ReservationProvider } from "./hooks/useReservation";
import { RegistrationFlowProvider } from "./hooks/useRegistrationFlow";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import RegisterPreferences from "./pages/RegisterPreferences";
import RegisterTerms from "./pages/RegisterTerms";
import RegisterConfirmation from "./pages/RegisterConfirmation";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Configurar basename según el entorno
const basename = import.meta.env.PROD ? '/web/site' : '/';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={basename}>
          <ReservationProvider>
            <RegistrationFlowProvider>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/preferences" element={<RegisterPreferences />} />
                <Route path="/register/terms" element={<RegisterTerms />} />
                <Route path="/register/confirmation" element={<RegisterConfirmation />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/404" element={<NotFound />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RegistrationFlowProvider>
          </ReservationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
