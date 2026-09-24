import { type CSSProperties, type TouchEvent, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

type UseSwipeSliderOptions = {
  /** Number of real slides. The hook adds one clone at each edge. */
  count: number;
  /** localStorage key remembering that the swipe hint was acted on. */
  storageKey: string;
};

const SWIPE_THRESHOLD_PX = 50;
const DIRECTION_LOCK_FACTOR = 1.2;
const TRANSITION = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";

type TouchState = {
  startX: number;
  startY: number;
  /** null until the gesture is classified as horizontal (true) or vertical (false). */
  horizontal: boolean | null;
};

/**
 * Where a swipe lands, given slides indexed 1..count with clones at 0 and
 * count+1.
 *
 * With animation the swipe may land on a clone; `onTransitionEnd` then swaps in
 * its real counterpart, which is what makes the loop seamless. Without
 * animation there is no `transitionend` to do that, so the clone has to be
 * skipped here or the slider strands on it.
 */
export function advanceIndex(current: number, step: 1 | -1, count: number, animated: boolean) {
  const next = current + step;
  if (animated || count === 0) return next;
  if (next === 0) return count;
  if (next === count + 1) return 1;
  return next;
}

function readHintSeen(storageKey: string) {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

/**
 * Touch-driven single-slide carousel with clone-edge looping. Slides are
 * indexed 1..count; 0 and count+1 are the clones that make the loop seamless.
 */
export function useSwipeSlider({ count, storageKey }: UseSwipeSliderOptions) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef<TouchState | null>(null);
  const jumpFrameRef = useRef<number | null>(null);

  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(1);
  const [deltaX, setDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animated, setAnimated] = useState(true);
  const [hintSeen, setHintSeen] = useState(() => readHintSeen(storageKey));
  const [fullyVisible, setFullyVisible] = useState(false);

  // Measure the viewport for pixel-exact translation, and keep it current on
  // rotation and resize.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The hint only makes sense while the first real slide is fully on screen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFullyVisible(entry.intersectionRatio >= 1),
      { threshold: [1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIndex(1);
  }, [count]);

  useEffect(
    () => () => {
      if (jumpFrameRef.current !== null) cancelAnimationFrame(jumpFrameRef.current);
    },
    [],
  );

  const resetTouch = () => {
    touchRef.current = null;
    setDeltaX(0);
    setIsDragging(false);
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchRef.current = { startX: touch.clientX, startY: touch.clientY, horizontal: null };
    setDeltaX(0);
    setIsDragging(false);
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const state = touchRef.current;
    if (!state) return;
    const touch = event.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (state.horizontal === null) {
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      state.horizontal = Math.abs(dx) > Math.abs(dy) * DIRECTION_LOCK_FACTOR;
      if (state.horizontal) setIsDragging(true);
    }

    if (state.horizontal) {
      if (event.cancelable) event.preventDefault();
      setDeltaX(dx);
    }
  };

  const onTouchEnd = () => {
    if (touchRef.current?.horizontal && Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      setIndex((current) =>
        advanceIndex(current, deltaX < 0 ? 1 : -1, count, !prefersReducedMotion),
      );
      if (!hintSeen) {
        try {
          localStorage.setItem(storageKey, "true");
        } catch {
          // Storage may be unavailable; the hint simply shows again next time.
        }
        setHintSeen(true);
      }
    }
    resetTouch();
  };

  // Seamless loop: after sliding onto a clone, jump to its real counterpart
  // without animating, then re-enable animation on the following frame.
  const onTransitionEnd = () => {
    if (count === 0) return;
    const target = index === 0 ? count : index === count + 1 ? 1 : null;
    if (target === null) return;
    setAnimated(false);
    jumpFrameRef.current = requestAnimationFrame(() => {
      setIndex(target);
      jumpFrameRef.current = requestAnimationFrame(() => setAnimated(true));
    });
  };

  const trackStyle: CSSProperties = {
    transform: `translateX(${-(index * width) + (isDragging ? deltaX : 0)}px)`,
    // The kit removes movement entirely when reduced motion is asked for.
    transition: isDragging || !animated || prefersReducedMotion ? "none" : TRANSITION,
  };

  return {
    containerRef,
    trackStyle,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    onTransitionEnd,
    hintVisible: fullyVisible && !hintSeen && count > 1 && index === 1,
  } as const;
}
