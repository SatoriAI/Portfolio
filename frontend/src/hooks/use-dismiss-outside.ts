import { type RefObject, useEffect } from "react";

import { useLatest } from "@/hooks/use-latest";

/**
 * While `active`, a press anywhere outside `ref` that lifts where it was, or
 * Escape, calls `onDismiss`: how a chosen filter lets go when the reader
 * presses elsewhere on the page. Lifts, not presses: on a phone every scroll
 * begins as a press, and the reader scrolls on to read what the filter
 * chose; the browser cancels a press that becomes a scroll, so it never
 * lifts. Not a click either, which iOS Safari does not send to the document
 * from plain text. Escape inside a dialog is the dialog's own, to close it,
 * and leaves the choice alone. The listeners exist only while there is
 * something to dismiss.
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
    // The pointer pressed outside and not yet lifted or cancelled.
    let pressed: number | null = null;
    const outside = (event: Event) => !ref.current?.contains(event.target as Node);
    const onPointerDown = (event: PointerEvent) => {
      pressed = outside(event) ? event.pointerId : null;
    };
    const onPointerCancel = () => {
      pressed = null;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === pressed && outside(event)) dismiss.current();
      pressed = null;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const inDialog = (event.target as Element | null)?.closest?.('[role="dialog"]');
      if (event.key === "Escape" && !inDialog) dismiss.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, ref, dismiss]);
}
