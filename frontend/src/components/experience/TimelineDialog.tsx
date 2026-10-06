import { type KeyboardEvent, type ReactNode, useCallback, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { revealFromCircle } from "@/lib/reveal";
import type { TimelineId } from "@/lib/timeline";

/**
 * One timeline entry, opened out of its circle. The panel grows from the
 * pressed circle as a widening clip-path circle, and shrinks back into the
 * circle of the entry it shows when it closes, so the visitor sees where the
 * entry came from and where it went. Centred from sm; a sheet on the bottom
 * edge of a phone. The scrim is light, so the timeline and the line drawn on
 * it stay readable behind the panel.
 *
 * The arrows, on screen and on the keyboard, step to the entry that began
 * before or after, and the timeline behind draws that entry's line. Radix
 * keeps focus inside and Esc closes; focus then returns to the circle of the
 * entry last shown. With reduced motion the panel fades instead of growing.
 *
 * What the panel says is the page's: it renders an entry by id, and is handed
 * the panel's own close, so a control inside can shrink the panel away first.
 */

export type TimelineDialogLabels = {
  previous: string;
  next: string;
  close: string;
};

export type TimelineDialogItem<Id extends TimelineId> = {
  id: Id;
  /** Read out with the arrows, e.g. "Previous: Nokia Solutions and Networks". */
  name: string;
  /** Shown on the arrows. */
  shortName: string;
};

type TimelineDialogProps<Id extends TimelineId> = {
  /** Every entry, in the order they began: the order the arrows step through. */
  items: readonly TimelineDialogItem<Id>[];
  /** The entry shown. */
  selectedId: Id | null;
  open: boolean;
  onSelect: (id: Id) => void;
  /** Called once the panel has shrunk away. */
  onClose: () => void;
  labels: TimelineDialogLabels;
  /** The entry's content; `close` shrinks the panel away, then runs `after`. */
  children: (id: Id, close: (after?: () => void) => void) => ReactNode;
};

/**
 * Longer than the kit's 400 ms section entrance: the panel travels further
 * than 8 px. Closing is quicker and accelerates, because the visitor has
 * already decided to leave.
 */
const OPEN = { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
const CLOSE = { duration: 280, easing: "cubic-bezier(0.4, 0, 1, 1)" };
const FADE_MS = 200;

// An entry may have more than one circle on the page (the timeline's, and
// the sidebar's on Experience); the panel grows from the one on screen, and
// not from a faint trace left where the circle has flown from.
const circleOf = (id: TimelineId) => {
  const circles = [...document.querySelectorAll<HTMLElement>(`[data-timeline-circle="${id}"]`)];
  return (
    circles.find((circle) => {
      const box = circle.getBoundingClientRect();
      const shown =
        getComputedStyle(circle).visibility !== "hidden" && circle.dataset.away === undefined;
      return shown && box.width > 0 && box.bottom > 0 && box.top < window.innerHeight;
    }) ?? circles[0]
  );
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The panel's animation out of, or back into, the circle of the entry it
 * shows; a fade where motion is reduced or the circle cannot be found.
 * Resolves once the panel is fully shown or gone.
 */
const play = (
  direction: "open" | "close",
  panel: HTMLElement,
  scrim: HTMLElement | null,
  id: TimelineId | null,
): Promise<unknown> => {
  const opening = direction === "open";
  const timing = opening ? OPEN : CLOSE;
  const fade = { opacity: opening ? [0, 1] : [1, 0] };
  scrim?.animate(fade, { duration: timing.duration, fill: "forwards" });
  const circle = id === null ? null : circleOf(id);
  if (reducedMotion() || !circle) {
    return panel.animate(fade, { duration: FADE_MS, fill: "forwards" }).finished;
  }
  const { from, to } = revealFromCircle(
    panel.getBoundingClientRect(),
    circle.getBoundingClientRect(),
  );
  return panel.animate(
    { clipPath: opening ? [from, to] : [to, from] },
    // Once open the clip is dropped, so nothing clips the panel; once closed
    // it holds, so the panel stays hidden until it unmounts.
    { ...timing, fill: opening ? "none" : "forwards" },
  ).finished;
};

const TimelineDialog = <Id extends TimelineId>({
  items,
  selectedId,
  open,
  onSelect,
  onClose,
  labels,
  children,
}: TimelineDialogProps<Id>) => {
  const content = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const index = items.findIndex((item) => item.id === selectedId);
  const item = items[index];
  const previous = items[index - 1];
  const next = items[index + 1];

  // The entry last shown: read by the panel's ref, which is set up once, and
  // by the focus return, which runs after the page has already cleared it.
  const shown = useRef(selectedId);
  if (selectedId !== null) shown.current = selectedId;

  // Runs as the panel mounts, before it is painted, so it never flashes at
  // full size first.
  const mountPanel = useCallback((node: HTMLDivElement | null) => {
    content.current = node;
    if (node) play("open", node, overlay.current, shown.current);
  }, []);

  // Shrinks the panel away, then closes; `after` runs once it has gone.
  const close = (after?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    const finish = () => {
      closing.current = false;
      onClose();
      after?.();
    };
    if (content.current) {
      play("close", content.current, overlay.current, selectedId).then(finish, finish);
    } else finish();
  };

  const step = (target: TimelineDialogItem<Id> | undefined) => {
    if (!target) return;
    onSelect(target.id);
    body.current?.scrollTo({ top: 0 });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft") step(previous);
    else if (event.key === "ArrowRight") step(next);
    else return;
    event.preventDefault();
  };

  return (
    <DialogPrimitive.Root open={open && !!item} onOpenChange={(value) => !value && close()}>
      <DialogPortal>
        <DialogOverlay
          ref={overlay}
          className="bg-foreground/15 backdrop-blur-none data-[state=closed]:animate-none data-[state=open]:animate-none"
        />
        <DialogPrimitive.Content
          ref={mountPanel}
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (shown.current !== null) circleOf(shown.current)?.focus({ preventScroll: true });
          }}
          onKeyDown={onKeyDown}
          className={
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-card bg-card shadow-xl focus:outline-none " +
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-3rem)] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:border sm:border-border"
          }
        >
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-lavender hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">{labels.close}</span>
          </DialogPrimitive.Close>

          {item && (
            <>
              <div ref={body} className="overflow-y-auto px-6 pb-8 pt-6 sm:px-8 sm:pt-8">
                {/* Keyed, so a step to another entry fades the new one in. */}
                <div
                  key={item.id}
                  className="duration-300 animate-in fade-in-0 motion-reduce:animate-none"
                >
                  {children(item.id, close)}
                </div>
              </div>

              {(previous || next) && (
                <nav className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 sm:px-6">
                  {previous ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${labels.previous}: ${previous.name}`}
                      onClick={() => step(previous)}
                    >
                      <ArrowLeft />
                      {previous.shortName}
                    </Button>
                  ) : (
                    <span />
                  )}
                  {next && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${labels.next}: ${next.name}`}
                      onClick={() => step(next)}
                    >
                      {next.shortName}
                      <ArrowRight />
                    </Button>
                  )}
                </nav>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
};

export default TimelineDialog;
