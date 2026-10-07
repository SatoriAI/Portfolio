import { type KeyboardEvent, type ReactNode, useLayoutEffect, useRef } from "react";

import { circleControl, circleState } from "@/components/experience/circleStyles";
import { TimelineAxis, TimelineGridlines } from "@/components/experience/TimelineAxis";
import { edgeOffset } from "@/lib/edgeEntrance";
import { prefersReducedMotion } from "@/lib/media";
import { EASE_BRAND } from "@/lib/motion";
import { type Timeline, type TimelineId, type TimelineInput } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * A career drawn to scale, as a set of entries to choose from: the roles on
 * Experience, the degrees and the teaching on Education.
 *
 * Each entry is a circle holding its mark (a company's logo, a degree's
 * abbreviation), set on its lane at the entry's first month, with its name
 * above it. Entries that ran at the same time stack into lanes. The circles
 * keep still at rest, as the kit asks of anything not answering the reader
 * (no autoplay loops); a circle lifts a little under the pointer, which is
 * what says it can be pressed. Choosing a circle draws that entry's line in iris from the circle to its
 * last month, rings the circle, and lets the page open the entry out of it;
 * when the entry closes the page clears the choice and the line draws back
 * into the circle. Only the chosen entry's line is ever shown; one still
 * running ends in the navy dot and "now". Ticks are one per January.
 *
 * Built as a CSS grid with one column per month rather than as an SVG so the
 * labels stay in CSS pixels at every width. The circles are buttons: Tab
 * reaches them, Enter or Space chooses, and the arrow keys move between them
 * in the order the entries began. With reduced motion nothing lifts and the
 * line appears at once.
 */

type CareerTimelineLabels = {
  /** Accessible name of the figure. */
  figure: string;
  /** Marks the end of the entry still running. */
  now: string;
};

export type TimelineEntry<Id extends TimelineId> = TimelineInput<Id> & {
  /** Set above the circle. */
  label: string;
  /** Set instead on a phone, where a long label would reach the next entry. */
  shortLabel?: string;
  /** The circle's accessible name. */
  ariaLabel: string;
  /** What fills the circle; it should fill its box (size-full). */
  mark: ReactNode;
};

type CareerTimelineProps<Id extends TimelineId> = {
  entries: readonly TimelineEntry<Id>[];
  labels: CareerTimelineLabels;
  /** The entry whose line is drawn in full, or null for none. */
  selectedId: Id | null;
  /**
   * Entries to light up while something elsewhere on the page points at them
   * (a skill used in these roles): their circles are ringed and the rest
   * recede. Null when nothing is pointed at.
   */
  highlightedIds?: ReadonlySet<Id> | null;
  /** Told which entry is pointed at or focused, and null when none is. */
  onPreview?: (id: Id | null) => void;
  /**
   * The circles are shown elsewhere: on Experience they fly to a sidebar
   * beside the skills as the reader scrolls down. A faint trace stays here,
   * so the timeline never stands empty.
   */
  circlesAway?: boolean;
  /**
   * On arriving at the page, the circles on screen fly in from its nearer
   * side and settle on their lanes, in the order the entries began. Once,
   * and never under reduced motion. A deliberate exception to the kit's 8px
   * entrance, asked for on Experience.
   */
  enterFromEdges?: boolean;
  onSelect: (id: Id) => void;
  /**
   * The entries laid out on their axis (lib/timeline's buildTimeline), built
   * once by the page and shared with whatever else reads the same scale.
   */
  timeline: Timeline<Id>;
  className?: string;
};

/**
 * Name above, circle below it, the line through the circle's centre. The
 * circle is 40px on a phone and 56px from md; its centre is 48px or 56px
 * down the lane, and the lane leaves room under it before the next name.
 */
const LANE_HEIGHT_PX = 100;

/** The entrance from the edges: each flight, and the wait between circles. */
const ENTER_MS = 900;
const ENTER_STAGGER_MS = 90;

const CareerTimeline = <Id extends TimelineId>({
  entries,
  labels,
  selectedId,
  highlightedIds = null,
  onPreview,
  circlesAway = false,
  enterFromEdges = false,
  onSelect,
  timeline,
  className,
}: CareerTimelineProps<Id>) => {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const count = timeline.spans.length;

  // Before the first paint, so no circle shows in place and then jumps out.
  const entered = useRef(false);
  useLayoutEffect(() => {
    if (!enterFromEdges || entered.current || count === 0) return;
    entered.current = true;
    if (prefersReducedMotion()) return;
    buttons.current.forEach((button, index) => {
      const from =
        button && edgeOffset(button.getBoundingClientRect(), window.innerWidth, window.innerHeight);
      if (!button || !from) return;
      // translate, not transform, so the hover lift is left alone.
      button.animate([{ translate: `${from.x}px ${from.y}px` }, { translate: "0 0" }], {
        duration: ENTER_MS,
        delay: index * ENTER_STAGGER_MS,
        easing: EASE_BRAND,
        fill: "backwards",
      });
    });
  }, [enterFromEdges, count]);

  if (count === 0) return null;

  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  // Arrows move between circles in the order the entries began, wrapping round.
  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    buttons.current[(index + step + count) % count]?.focus();
  };

  return (
    <figure aria-label={labels.figure} className={cn("w-full", className)}>
      <div className="relative">
        <TimelineAxis ticks={timeline.ticks} months={timeline.months} />
        <TimelineGridlines
          ticks={timeline.ticks}
          months={timeline.months}
          className="inset-x-0 bottom-0 top-7"
        />

        <ol
          className="grid gap-y-0 pt-3"
          style={{
            gridTemplateColumns: `repeat(${timeline.months}, minmax(0, 1fr))`,
            gridAutoRows: `${LANE_HEIGHT_PX}px`,
          }}
        >
          {timeline.spans.map((span, index) => {
            const entry = byId.get(span.id);
            if (!entry) return null;
            const selected = span.id === selectedId;
            const highlighted = highlightedIds?.has(span.id) ?? false;
            const receded = highlightedIds !== null && !highlighted;
            return (
              <li
                key={span.id}
                className="relative"
                style={{
                  gridColumn: `${span.startMonth + 1} / ${span.endMonth + 1}`,
                  gridRow: span.lane + 1,
                }}
              >
                {/* The line runs from the circle's centre to the entry's end,
                    and appears only while the entry is chosen. */}
                <span
                  aria-hidden="true"
                  className="absolute left-5 right-0 top-[47px] h-0.5 md:left-7 md:top-[55px]"
                >
                  <span
                    className={cn(
                      "absolute inset-0 origin-left bg-iris",
                      "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-brand",
                      selected ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                  {span.current && (
                    <span
                      className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 motion-safe:transition-opacity motion-safe:duration-300",
                        // The dot and "now" arrive as the line reaches them.
                        selected ? "opacity-100 motion-safe:delay-300" : "opacity-0",
                      )}
                    >
                      <span className="block h-3 w-3 rounded-full bg-primary" />
                      {/* Above the dot rather than after it: after it, the label
                          would stand outside the content column. */}
                      <span className="absolute bottom-full right-0 mb-1 font-mono text-meta text-foreground">
                        {labels.now}
                      </span>
                    </span>
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-0 whitespace-nowrap text-sm font-medium transition-colors duration-200",
                    // A role a chosen skill passed over greys, but stays legible.
                    selected ? "text-iris" : receded ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {/* Short on a phone, where a long name would reach the next
                      entry on its lane; whole from sm. */}
                  <span className="sm:hidden">{entry.shortLabel ?? entry.label}</span>
                  <span className="hidden sm:inline">{entry.label}</span>
                </span>

                <button
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={entry.ariaLabel}
                  // The entry's dialog finds its circle by this, to grow out
                  // of it and shrink back into it.
                  data-timeline-circle={span.id}
                  data-away={circlesAway || undefined}
                  onClick={() => onSelect(span.id)}
                  onPointerEnter={() => onPreview?.(span.id)}
                  onPointerLeave={() => onPreview?.(null)}
                  onFocus={() => onPreview?.(span.id)}
                  onBlur={() => onPreview?.(null)}
                  onKeyDown={onKeyDown(index)}
                  className={cn(
                    "group absolute left-0 top-7 size-10 md:size-14",
                    circleControl,
                    circleState(selected, highlighted),
                    circlesAway ? "opacity-30" : receded ? "opacity-40" : "opacity-100",
                  )}
                >
                  {entry.mark}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
};

export default CareerTimeline;
