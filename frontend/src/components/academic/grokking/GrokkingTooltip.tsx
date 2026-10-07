import { forwardRef } from "react";

import { MarkSwatch } from "@/components/academic/grokking/marks";
import { GROKKING_RUNS, type Metric, readoutAt } from "@/lib/grokking";

/**
 * The values at the marked step, one per run, marked as the key marks them.
 * The step itself is on the axis under the crosshair and in the sentence
 * above, which also says the values in words to a screen reader. Set at the
 * tick labels' size: it is chart text, and small enough to fit between the
 * lines where the runs part, at steps 1000 and 2000. It fades in once, then
 * jumps with the crosshair: `duration-200` alone would also tween its
 * position, sliding it over the marks it must keep clear of.
 *
 * The chart measures it and places it; until it has a place it is drawn
 * unseen, so it never shows in the wrong one.
 */
const GrokkingTooltip = forwardRef<
  HTMLDivElement,
  {
    step: number;
    metrics: readonly Metric[];
    at: { left: number; top: number } | null;
    formatPercent: (value: number) => string;
  }
>(({ step, metrics, at, formatPercent }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className="pointer-events-none absolute z-10 space-y-1 rounded-xl border border-border bg-card px-3 py-2 shadow-md transition-none duration-200 animate-in fade-in-0 motion-reduce:animate-none"
    style={at ? { left: at.left, top: at.top } : { left: 0, top: 0, visibility: "hidden" }}
  >
    {metrics.map((metric) => (
      <p
        key={metric}
        className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] tabular-nums leading-4 text-foreground"
      >
        <MarkSwatch metric={metric} />
        {readoutAt(GROKKING_RUNS, step, metric, formatPercent).join(" · ")}
      </p>
    ))}
  </div>
));
GrokkingTooltip.displayName = "GrokkingTooltip";

export default GrokkingTooltip;
