import { useCallback, useSyncExternalStore } from "react";

import { matchesMedia, MEDIA, mediaList } from "@/lib/media";

/**
 * Whether a media query matches, kept in sync as it changes. Read
 * synchronously, so the first render already matches the viewport; except
 * on a page rendered at build time, which has no viewport and matches
 * nothing (a phone's layout, with motion), and in the browser's takeover of
 * that page, which must render the same; React re-renders with the
 * viewport's answer straight after.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = mediaList(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => matchesMedia(query),
    () => false,
  );
}

/**
 * True when the visitor has asked for reduced motion. The kit requires that
 * movement and animated scrolling are removed in that case while all content
 * stays visible, so anything animating in JavaScript has to consult this.
 */
export const usePrefersReducedMotion = () => useMediaQuery(MEDIA.reducedMotion);

/** True below Tailwind's `md` breakpoint. */
export const useIsMobile = () => !useMediaQuery(MEDIA.md);
