import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ScrollRevealOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  /**
   * When true, the element will only reveal once and stop observing after first intersection
   */
  once?: boolean;
};

export function useScrollReveal<T extends HTMLElement = HTMLElement>(options?: ScrollRevealOptions) {
  const { root = null, rootMargin = '0px 0px -10% 0px', threshold = 0.1, once = true } = options || {};

  const elementRef = useRef<T | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const setRef = useCallback((node: T | null) => {
    elementRef.current = node;
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
      { root, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once, prefersReducedMotion]);

  return { ref: setRef, isRevealed, prefersReducedMotion } as const;
}


