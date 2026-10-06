import { useCallback, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * A figure that shows what its slider does by moving it once: the first time
 * the figure is mostly in view, the value runs from `from` to `to`, then, if
 * `rest` is given, eases back to it, the figure's clearest moment, and stops;
 * the reader has the slider from then on. Touching the slider
 * mid-run stops it where it is (`stop`, called from the slider's handler).
 * Under reduced motion nothing runs and the value stays as the page set it.
 *
 * The ref is a callback, so a figure that mounts later, inside a fold opened
 * by the reader, is watched from the moment it appears.
 */

type DemoRun = {
  from: number;
  to: number;
  durationMs: number;
  /** Held back after the figure comes into view, e.g. while it draws itself. */
  delayMs?: number;
  /** Where the run comes back to and stops, after reaching `to`. */
  rest?: number;
};

/** How long the way back to `rest` takes. */
const RETURN_MS = 900;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function useDemoRun<T extends Element>(
  onValue: (value: number) => void,
  { from, to, durationMs, delayMs = 0, rest }: DemoRun,
) {
  const [element, setElement] = useState<T | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const stopped = useRef(false);
  const frame = useRef(0);
  // Read through a ref, so a new callback each render does not restart the run.
  const set = useRef(onValue);
  set.current = onValue;

  useEffect(() => {
    if (!element || prefersReducedMotion || stopped.current) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          let begin: number | null = null;
          const total = durationMs + (rest === undefined ? 0 : RETURN_MS);
          const step = (now: number) => {
            if (stopped.current) return;
            begin ??= now;
            const elapsed = now - begin;
            if (elapsed <= durationMs || rest === undefined) {
              set.current(from + (to - from) * easeInOut(Math.min(1, elapsed / durationMs)));
            } else {
              const back = easeInOut(Math.min(1, (elapsed - durationMs) / RETURN_MS));
              set.current(to + (rest - to) * back);
            }
            if (elapsed < total) frame.current = requestAnimationFrame(step);
            else stopped.current = true;
          };
          frame.current = requestAnimationFrame(step);
        }, delayMs);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame.current);
    };
  }, [element, prefersReducedMotion, from, to, durationMs, delayMs, rest]);

  const stop = useCallback(() => {
    stopped.current = true;
    cancelAnimationFrame(frame.current);
  }, []);

  return { ref: setElement, stop };
}
