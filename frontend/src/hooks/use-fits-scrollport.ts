import { type RefObject, useLayoutEffect, useState } from "react";

/** The nearest ancestor that scrolls vertically, or null when the page does. */
const scrollportOf = (element: HTMLElement) => {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
};

/**
 * Whether the element fits whole inside the box that scrolls it, inside that
 * box's padding: the test for holding it sticky, since a sticky element
 * taller than its scrollport keeps its foot out of sight until the scrolling
 * reaches the end. Kept up to date as either resizes (a longer translation, a
 * shorter window). Measured before the first paint, so nothing jumps.
 */
export function useFitsScrollport(ref: RefObject<HTMLElement | null>) {
  const [fits, setFits] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    const scrollport = element && scrollportOf(element);
    if (!element || !scrollport) return;
    const update = () => {
      const style = getComputedStyle(scrollport);
      const room =
        scrollport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setFits(element.offsetHeight <= room);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(scrollport);
    return () => observer.disconnect();
  }, [ref]);
  return fits;
}
