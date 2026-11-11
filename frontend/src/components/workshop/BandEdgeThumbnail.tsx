import { useRef } from "react";

import { useElementSize } from "@/hooks/use-element-size";
import { symbolRatio } from "@/lib/gridAverages";

/**
 * The counterexample piece's result in small: the share of the continuous
 * operator's action that the grid's operator reproduces, from slow waves on
 * the left to the grid's limit of resolution on the right, where the curve
 * ends on 4/π² ≈ 41% and the piece's wave sits. Still, like every drawing in
 * the lists; the end point is the mark that lights when the row is pointed
 * at. Drawn in pixels at the width it is given, so its labels keep the kit's
 * sizes on a phone and at 1440 alike.
 */

export type BandEdgeLabels = {
  /** The two ends of the horizontal axis. */
  slow: string;
  limit: string;
  /** The line under the drawing. */
  caption: string;
};

const HEIGHT = 132;
const PAD = { top: 8, right: 8, bottom: 22, left: 38 };
/** Points along the curve. */
const SAMPLES = 60;
/** The share at the limit of resolution, where the curve ends. */
const EDGE = symbolRatio(1, 2);

const BandEdgeThumbnail = ({ labels }: { labels: BandEdgeLabels }) => {
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);

  // Across: a wave's frequency as a share of the grid's limit. Up: 0 to 100%.
  const x = (share: number) => PAD.left + share * (width - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - value) * (HEIGHT - PAD.top - PAD.bottom);
  const curve = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const share = i / SAMPLES;
    return `${x(share).toFixed(2)},${y(symbolRatio(share, 2)).toFixed(2)}`;
  }).join(" ");

  return (
    <div ref={box} aria-hidden="true">
      {/* Drawn at the measured width; until then (in the page's HTML) its
          room is held, so the page does not grow when it is measured. */}
      {width > 0 ? (
        <svg width={width} height={HEIGHT} className="block overflow-visible">
          {[0, EDGE, 1].map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(value)}
                y2={y(value)}
                strokeDasharray={value === EDGE ? "2 4" : undefined}
                className={value === EDGE ? "stroke-control-border" : "stroke-border"}
              />
              <text
                x={PAD.left - 6}
                y={y(value) + 3}
                textAnchor="end"
                className={
                  value === EDGE
                    ? "fill-iris font-mono text-[11px]"
                    : "fill-muted-foreground font-mono text-[11px]"
                }
              >
                {Math.round(value * 100)}%
              </text>
            </g>
          ))}
          <text x={PAD.left} y={HEIGHT - 6} className="fill-muted-foreground font-mono text-[11px]">
            {labels.slow}
          </text>
          <text
            x={width - PAD.right}
            y={HEIGHT - 6}
            textAnchor="end"
            className="fill-muted-foreground font-mono text-[11px]"
          >
            {labels.limit}
          </text>
          <polyline
            points={curve}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            className="stroke-iris"
          />
          <circle
            cx={x(1)}
            cy={y(EDGE)}
            r={4.5}
            strokeWidth={1.5}
            className="fill-lavender-deep stroke-transparent transition-colors duration-200 group-focus-within/piece:fill-iris group-focus-within/piece:stroke-iris group-hover/piece:fill-iris group-hover/piece:stroke-iris motion-reduce:transition-none"
          />
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}
      <p className="mt-2 text-sm text-muted-foreground">{labels.caption}</p>
    </div>
  );
};

export default BandEdgeThumbnail;
