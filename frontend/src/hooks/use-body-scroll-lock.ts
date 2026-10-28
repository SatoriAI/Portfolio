import { useEffect } from "react";

/**
 * Locks page scrolling while `active` is true, compensating for the scrollbar
 * width so the page does not shift sideways when the bar disappears. The lock
 * goes on html, the page's scroller: html clips its overflow (index.css), so
 * body's overflow no longer reaches the viewport, and hidden on body would
 * stop nothing.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const { overflow } = root.style;
    const { paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      root.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [active]);
}
