import { type RefObject, useEffect, useRef, useState } from "react";

export type InViewOptions = {
  /** How much of the element must show, 0 to 1. */
  threshold?: number;
  rootMargin?: string;
  /** False keeps the hook idle, e.g. under reduced motion or once done. */
  enabled?: boolean;
};

/** Whether the element is on screen, kept up to date as it scrolls in and out. */
export function useInView(
  ref: RefObject<Element | null> | undefined,
  { threshold = 0, rootMargin, enabled = true }: InViewOptions = {},
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref?.current;
    if (!element || !enabled) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold,
      rootMargin,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, enabled]);
  return inView;
}

/**
 * Calls `onSeen` once, the first time the element is in view, and stops
 * watching. The latest `onSeen` is the one called, so it need not be stable.
 */
export function useOnceInView(
  ref: RefObject<Element | null>,
  onSeen: () => void,
  { threshold = 0, rootMargin, enabled = true }: InViewOptions = {},
) {
  const callback = useRef(onSeen);
  useEffect(() => {
    callback.current = onSeen;
  });
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        callback.current();
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, enabled]);
}
