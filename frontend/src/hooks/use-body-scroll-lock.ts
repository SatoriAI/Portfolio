import { useEffect } from "react";

// Locks held at once (the menu and Vex can both be open): the first saves
// html's own overflow, the last puts it back, in whatever order they let go.
let locks = 0;
let saved = "";

/**
 * Locks page scrolling while `active` is true. The lock goes on html, the
 * page's scroller: html clips its overflow (index.css), so body's overflow no
 * longer reaches the viewport, and hidden on body would stop nothing. The
 * scrollbar needs no stand-in: html keeps its gutter (scrollbar-gutter:
 * stable), so nothing shifts when the bar goes.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    if (locks === 0) {
      saved = root.style.overflow;
      root.style.overflow = "hidden";
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0) root.style.overflow = saved;
    };
  }, [active]);
}
