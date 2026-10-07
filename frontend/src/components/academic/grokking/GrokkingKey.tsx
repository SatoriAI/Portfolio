import { type CSSProperties, forwardRef } from "react";

import { MarkSwatch } from "@/components/academic/grokking/marks";
import type { Metric } from "@/lib/grokking";

/**
 * The key, in the plot's lower-right corner, which the lines have left empty
 * by then (see KEY_FROM_STEP in GrokkingChart). Its surface hides the
 * crosshair as it passes, so the names stay whole. Placed by the chart, which
 * also measures it to keep the tooltip off it.
 */
const GrokkingKey = forwardRef<
  HTMLUListElement,
  { series: readonly { metric: Metric; name: string }[]; style: CSSProperties }
>(({ series, style }, ref) => (
  <ul
    ref={ref}
    className="pointer-events-none absolute space-y-1 bg-card text-sm text-foreground"
    style={style}
  >
    {series.map(({ metric, name }) => (
      <li key={metric} className="flex items-start gap-2">
        <MarkSwatch metric={metric} className="mt-1" />
        <span>{name}</span>
      </li>
    ))}
  </ul>
));
GrokkingKey.displayName = "GrokkingKey";

export default GrokkingKey;
