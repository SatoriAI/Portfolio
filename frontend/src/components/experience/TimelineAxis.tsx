import type { ReactNode } from "react";

import type { TimelineTick } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/** More years than this crowd a phone's width, so every other one is labelled. */
const DENSE_TICKS = 7;

const at = (month: number, months: number) => `${(month / months) * 100}%`;

/**
 * The career's axis: a January tick per year, the year set beside it. On a
 * phone a long span labels every other year, so the years never touch.
 * Shared by the timeline and the skill lanes, so the two read as one scale.
 */
export const TimelineAxis = ({
  ticks,
  months,
}: {
  ticks: readonly TimelineTick[];
  months: number;
}) => (
  <div aria-hidden="true" className="relative h-7 border-b border-border">
    {ticks.map((tick, index) => (
      <span
        key={tick.year}
        className="absolute bottom-0 flex flex-col items-start"
        style={{ left: at(tick.month, months) }}
      >
        <span
          className={cn(
            "mb-1 ml-2 font-mono text-meta text-muted-foreground",
            ticks.length > DENSE_TICKS && index % 2 === 1 && "max-sm:invisible",
          )}
        >
          {tick.year}
        </span>
        <span className="block h-2 w-px bg-iris" />
      </span>
    ))}
  </div>
);

/**
 * Each January carried down through what is drawn under the axis, faint and
 * dashed, so a mark can be read against its year. Behind everything, and
 * never in the way of a press; `children` are drawn with them (a band).
 */
export const TimelineGridlines = ({
  ticks,
  months,
  className,
  children,
}: {
  ticks: readonly TimelineTick[];
  months: number;
  className?: string;
  children?: ReactNode;
}) => (
  <div aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
    {ticks.map((tick) => (
      <span
        key={tick.year}
        className="absolute inset-y-0 border-l border-dashed border-border"
        style={{ left: at(tick.month, months) }}
      />
    ))}
    {children}
  </div>
);
