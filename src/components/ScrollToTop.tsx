import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que hace scroll al inicio de la página
 * cada vez que cambia la ruta
 */
export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll al inicio de la página
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
