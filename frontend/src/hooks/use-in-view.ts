import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useLatest } from "@/hooks/use-latest";

/**
 * What to watch: a ref, for an element mounted with the component, or the
 * element itself, held in state through a callback ref. A ref is read when
 * the hook first runs and never again, so an element that can mount later
 * (after an early return, inside a fold) must be passed as state.
 */
export type InViewTarget = RefObject<Element | null> | Element | null | undefined;

export type InViewOptions = {
  /** How much of the element must show, 0 to 1. */
  threshold?: number;
  rootMargin?: string;
  /** False keeps the hook idle, e.g. under reduced motion or once done. */
  enabled?: boolean;
};

const elementOf = (target: InViewTarget) =>
  target && "current" in target ? target.current : (target ?? null);

/**
 * Whether the element is on screen, kept up to date as it scrolls in and
 * out; false again as soon as it is no longer watched (gone, or disabled),
 * so a value never outlives its element.
 */
export function useInView(
  target: InViewTarget,
  { threshold = 0, rootMargin, enabled = true }: InViewOptions = {},
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = elementOf(target);
    if (!element || !enabled) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold,
      rootMargin,
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(false);
    };
  }, [target, threshold, rootMargin, enabled]);
  return inView;
}

/**
 * Calls `onSeen` once, the first time the element is in view, and never
 * again, whatever its options do after. The latest `onSeen` is the one
 * called, so it need not be stable.
 */
export function useOnceInView(
  target: InViewTarget,
  onSeen: () => void,
  { threshold = 0, rootMargin, enabled = true }: InViewOptions = {},
) {
  const callback = useLatest(onSeen);
  const fired = useRef(false);
  useEffect(() => {
    const element = elementOf(target);
    if (!element || !enabled || fired.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        fired.current = true;
        callback.current();
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, threshold, rootMargin, enabled, callback]);
}

/**
 * Whether the element was already on screen when it mounted, read before the
 * first paint: an entrance for something the reader is already looking at
 * would show it and then hide it, so such an element is simply shown.
 */
export function useOnScreenAtMount(target: InViewTarget) {
  const [onScreen, setOnScreen] = useState(false);
  const measured = useRef(false);
  useLayoutEffect(() => {
    const element = elementOf(target);
    if (!element || measured.current) return;
    measured.current = true;
    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) setOnScreen(true);
  }, [target]);
  return onScreen;
}
