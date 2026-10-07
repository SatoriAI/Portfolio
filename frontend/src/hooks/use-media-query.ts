import { useCallback, useSyncExternalStore } from "react";

import { matchesMedia, MEDIA } from "@/lib/media";

/**
 * Whether a media query matches, kept in sync as it changes. Read
 * synchronously, so the first render already matches the viewport.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => matchesMedia(query));
}

/**
 * True when the visitor has asked for reduced motion. The kit requires that
 * movement and animated scrolling are removed in that case while all content
 * stays visible, so anything animating in JavaScript has to consult this.
 */
export const usePrefersReducedMotion = () => useMediaQuery(MEDIA.reducedMotion);

/** True below Tailwind's `md` breakpoint. */
export const useIsMobile = () => !useMediaQuery(MEDIA.md);
