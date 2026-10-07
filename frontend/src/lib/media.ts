/**
 * The site's media queries in one place: Tailwind's breakpoints (the same
 * widths as tailwind.config's screens) and the reduced-motion preference.
 */
export const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const;

export const MEDIA = {
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

/** Whether a query matches now: for code that runs once, in a handler or an effect. */
export const matchesMedia = (query: string) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;

/** The reduced-motion preference now; components that render by it use the hook. */
export const prefersReducedMotion = () => matchesMedia(MEDIA.reducedMotion);
