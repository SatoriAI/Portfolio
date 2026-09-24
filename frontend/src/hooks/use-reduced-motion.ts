import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const matches = () =>
  typeof window === "undefined" || typeof window.matchMedia === "undefined"
    ? false
    : window.matchMedia(REDUCED_MOTION_QUERY).matches;

/**
 * True when the visitor has asked for reduced motion. The kit requires that
 * movement and animated scrolling are removed in that case while all content
 * stays visible, so anything animating in JavaScript has to consult this.
 *
 * Initialised synchronously so the first render already honours the setting,
 * and kept in sync afterwards because the preference can change mid-session.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(matches);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setPrefersReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}
