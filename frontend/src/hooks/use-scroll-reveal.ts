import { useState } from "react";

import { useOnceInView, useOnScreenAtMount } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

/**
 * An entrance that plays once, the first time the element scrolls into view.
 * `isRevealed` turns true then and stays; `isInitiallyVisible` is true for an
 * element already on screen when it mounted, which should not animate at
 * all, and under reduced motion everything is revealed from the start.
 * `isMeasured` is false until the browser has placed the element: in a page
 * rendered at build time, and while the browser takes that page over.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>({
  // A positive bottom margin reveals a section shortly before it scrolls into
  // view, so text is never read mid-fade.
  rootMargin = "0px 0px 15% 0px",
  threshold = 0.1,
}: { rootMargin?: string; threshold?: number } = {}) {
  const [element, setElement] = useState<T | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const onScreenAtMount = useOnScreenAtMount(element);
  const isInitiallyVisible = onScreenAtMount === true;
  const [seen, setSeen] = useState(false);
  useOnceInView(element, () => setSeen(true), {
    rootMargin,
    threshold,
    enabled: !prefersReducedMotion && !isInitiallyVisible,
  });
  return {
    ref: setElement,
    isRevealed: seen || isInitiallyVisible || prefersReducedMotion,
    isInitiallyVisible,
    isMeasured: onScreenAtMount !== undefined,
    prefersReducedMotion,
  } as const;
}
