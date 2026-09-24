import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Keeps navigation predictable: a route change lands at the top, and a hash
 * (e.g. /#projects, also when arriving from another page) scrolls to that
 * section once it exists in the DOM.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const scrollToTarget = () =>
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    // Effects run after the new page has committed, so the section is normally
    // already there; the frame fallback covers a target rendered from data.
    if (document.getElementById(hash.slice(1))) {
      scrollToTarget();
      return;
    }
    const frame = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
