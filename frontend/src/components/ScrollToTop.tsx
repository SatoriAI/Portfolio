import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Always scroll to top on Academic route; otherwise keep mobile-only behavior
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(max-width: 767.98px)").matches;
    const shouldForceForThisRoute = pathname === "/academic";

    if (shouldForceForThisRoute || isMobile) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
