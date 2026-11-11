import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// New pages open at the top instead of keeping the previous page's scroll position.
export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};
