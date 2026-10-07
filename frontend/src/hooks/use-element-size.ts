import { type RefObject, useLayoutEffect, useState } from "react";

export type ElementSize = { width: number; height: number };

/**
 * The element's content box in CSS pixels, kept up to date as it resizes,
 * for drawings laid out in pixels. Measured before the first paint, so a
 * drawing never shows at the size it was given before it was measured.
 */
export function useElementSize(
  ref: RefObject<HTMLElement | null>,
  initial: ElementSize = { width: 0, height: 0 },
) {
  const [size, setSize] = useState(initial);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = (width: number, height: number) =>
      setSize((was) => (was.width === width && was.height === height ? was : { width, height }));
    // The same content box the observer reports, read now rather than after
    // the paint the observer's first report would come after.
    const style = getComputedStyle(element);
    update(
      element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
    );
    const observer = new ResizeObserver(([entry]) =>
      update(entry.contentRect.width, entry.contentRect.height),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
