import { type RefObject, useEffect } from "react";

import { useLatest } from "@/hooks/use-latest";

/**
 * While `active`, a click anywhere outside `ref`, or Escape, calls
 * `onDismiss`: how a chosen filter lets go when the reader presses elsewhere
 * on the page. A click, not a press: on a phone every scroll begins as a
 * press, and the reader scrolls on to read what the filter chose; a scroll
 * ends without a click, a tap with one. Escape inside a dialog is the dialog's own, to close it, and
 * leaves the choice alone. The listeners exist only while there is something
 * to dismiss.
 */
export function useDismissOutside(
  active: boolean,
  ref: RefObject<HTMLElement>,
  onDismiss: () => void,
) {
  // Read through a ref, so a new callback each render does not re-attach.
  const dismiss = useLatest(onDismiss);

  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) dismiss.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const inDialog = (event.target as Element | null)?.closest?.('[role="dialog"]');
      if (event.key === "Escape" && !inDialog) dismiss.current();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, ref, dismiss]);
}
