import type { Metric } from "@/lib/grokking";
import { cn } from "@/lib/utils";

/**
 * The two series' marks: new examples a filled iris circle, seen ones a
 * hollow grey square, so identity never rests on colour alone. Shared by the
 * plot, its key and its tooltip.
 */

type MarkProps = {
  x: number;
  y: number;
  /** A mark at the selected step, grown a little so the step reads in the plot. */
  active?: boolean;
};

/** How much a mark at the selected step grows (the literal `scale-[1.35]` below). */
const ACTIVE_SCALE = 1.35;

/**
 * How far any mark reaches from its centre at its largest: the square's half
 * side with half its stroke, grown. Whatever must keep clear of the marks
 * (the tooltip) measures them by this.
 */
export const MARK_REACH = (5 + 1.5 / 2) * ACTIVE_SCALE;

// Grown about its own centre, within the kit's 160–200 ms for hover feedback.
const markMotion = (active: boolean) =>
  cn(
    "origin-center transition-transform duration-200 ease-brand [transform-box:fill-box] motion-reduce:transition-none",
    active && "scale-[1.35]",
  );

export const SeenMark = ({ x, y, active = false }: MarkProps) => (
  <rect
    x={x - 5}
    y={y - 5}
    width={10}
    height={10}
    strokeWidth={1.5}
    className={cn("fill-none stroke-control-border", markMotion(active))}
  />
);

export const UnseenMark = ({ x, y, active = false }: MarkProps) => (
  <circle
    cx={x}
    cy={y}
    r={4}
    strokeWidth={2}
    className={cn("fill-iris stroke-card", markMotion(active))}
  />
);

/** A series' mark on its own, at text size, for the key and the tooltip. */
export const MarkSwatch = ({ metric, className }: { metric: Metric; className?: string }) => {
  const Mark = metric === "test" ? UnseenMark : SeenMark;
  return (
    <svg viewBox="0 0 12 12" className={cn("size-3 shrink-0", className)} aria-hidden="true">
      <Mark x={6} y={6} />
    </svg>
  );
};
