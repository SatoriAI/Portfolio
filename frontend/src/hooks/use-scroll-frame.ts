import { useLayoutEffect } from "react";

import { useLatest } from "@/hooks/use-latest";

/**
 * Runs `onFrame` before the first paint, then at most once a frame after any
 * scroll or resize, for drawings that follow the scroll. The latest
 * `onFrame` is the one run, so the listeners are added once; `watch` is
 * what, when it changes, calls for an immediate run (e.g. the elements it
 * measures). Idle while `enabled` is false.
 */
export function useScrollFrame(
  onFrame: () => void,
  { watch, enabled = true }: { watch?: unknown; enabled?: boolean } = {},
) {
  const latest = useLatest(onFrame);
  useLayoutEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const run = () => {
      frame = 0;
      latest.current();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, latest, watch]);
}
