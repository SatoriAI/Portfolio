import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";

export type ScrollRevealOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  /**
   * When true, the element will only reveal once and stop observing after first intersection
   */
  once?: boolean;
};

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options?: ScrollRevealOptions,
) {
  const {
    root = null,
    // A positive bottom margin reveals a section shortly before it scrolls into
    // view, so text is never read mid-fade.
    rootMargin = "0px 0px 15% 0px",
    threshold = 0.1,
    once = true,
  } = options || {};

  const elementRef = useRef<T | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  // Content already on screen when it mounts must never start hidden; this is
  // what keeps the first paint from looking blank.
  const [isInitiallyVisible, setIsInitiallyVisible] = useState(false);

  const prefersReducedMotion = usePrefersReducedMotion();

  const setRef = useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);

  // Layout effect: the state update re-renders before the browser paints, so
  // there is no opacity-0 frame for above-the-fold content.
  useLayoutEffect(() => {
    const node = elementRef.current;
    if (!node || typeof window === "undefined") return;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsInitiallyVisible(true);
      setIsRevealed(true);
    }
  }, []);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsRevealed(false);
          }
        });
      },
      { root, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once, prefersReducedMotion]);

  return { ref: setRef, isRevealed, isInitiallyVisible, prefersReducedMotion } as const;
}
