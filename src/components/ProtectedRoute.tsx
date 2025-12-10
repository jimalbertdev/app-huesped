import { ReactNode, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes by ensuring a reservation code exists in the URL.
 * If no reservation code is found, redirects to the 404 page.
 * 
 * @param children - The component to render if the route is protected
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Check for reservation code in URL (supports both 'reserva' and 'reservation' params)
        const reservationCode = searchParams.get('reserva') || searchParams.get('reservation');

        // If no reservation code is found, redirect to 404
        if (!reservationCode) {
            navigate('/404', { replace: true });
        }
    }, [searchParams, navigate]);

    // Check if reservation code exists
    const reservationCode = searchParams.get('reserva') || searchParams.get('reservation');

    // Show loading state while checking
    if (!reservationCode) {
        return (
            <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    // Render protected content
    return <>{children}</>;
};
