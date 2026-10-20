import { useRef } from "react";

import { useElementSize } from "@/hooks/use-element-size";
import { GROKKING_RUNS } from "@/lib/grokking";
import {
  DELAY_FROM,
  DELAY_TO,
  delayBand,
  HEIGHT,
  LAST_STEP,
  PAD,
  thumbnailScales,
} from "@/lib/grokkingThumbnail";
import { cn } from "@/lib/utils";

/**
 * The grokking piece's measurement in small: accuracy over training steps
 * for the three runs, training in grey and new examples in iris, with the
 * delay between them shaded and named. Still, with no pointer: the reading of
 * single values belongs to the Research page's chart, and this one only shows
 * the shape the piece is about. Drawn in pixels at the width it is given, so
 * its labels stay at the kit's sizes on a phone and at 1440 alike.
 */

export type GrokkingThumbnailLabels = {
  newExamples: string;
  training: string;
  delay: string;
};

const GrokkingThumbnail = ({ labels }: { labels: GrokkingThumbnailLabels }) => {
  const box = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(box);

  const { x, y } = thumbnailScales(width);
  const band = delayBand(width);
  const line = (metric: "train" | "test", points: (typeof GROKKING_RUNS)[number]["points"]) =>
    points.map((point) => `${x(point.step)},${y(point[metric])}`).join(" ");

  return (
    <div ref={box} aria-hidden="true">
      {/* Drawn at the measured width; until then (in the page's HTML) its
          room is held, so the page does not grow when it is measured. */}
      {width > 0 ? (
        <svg width={width} height={HEIGHT} className="block overflow-visible">
          {band && (
            <rect
              {...band}
              // Its edges turn iris when the row it sits in is pointed at (the
              // workshop index's reading of a result); still elsewhere.
              className="fill-blush stroke-transparent transition-colors duration-200 group-focus-within/piece:stroke-iris group-hover/piece:stroke-iris motion-reduce:transition-none"
              strokeWidth={1.5}
            />
          )}
          {/* Narrow on a phone: one size down, so the name stays inside its band. */}
          <text
            x={(x(DELAY_FROM) + x(DELAY_TO)) / 2}
            y={y(1) + 16}
            textAnchor="middle"
            className={cn(
              "fill-iris font-mono uppercase",
              x(DELAY_TO) - x(DELAY_FROM) < 100
                ? "text-[11px] tracking-normal"
                : "text-[11px] tracking-widest",
            )}
          >
            {labels.delay}
          </text>
          {[0, 0.5, 1].map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(value)}
                y2={y(value)}
                className="stroke-border"
              />
              <text
                x={PAD.left - 6}
                y={y(value) + 3}
                textAnchor="end"
                className="fill-muted-foreground font-mono text-[11px]"
              >
                {Math.round(value * 100)}%
              </text>
            </g>
          ))}
          {[0, LAST_STEP / 2, LAST_STEP].map((step, index) => (
            <text
              key={step}
              x={x(step)}
              y={HEIGHT - 6}
              textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
              className="fill-muted-foreground font-mono text-[11px]"
            >
              {step}
            </text>
          ))}
          {GROKKING_RUNS.map((run) => (
            <polyline
              key={`train-${run.seed}`}
              points={line("train", run.points)}
              fill="none"
              strokeWidth={1.25}
              className="stroke-control-border"
            />
          ))}
          {GROKKING_RUNS.map((run) => (
            <polyline
              key={`test-${run.seed}`}
              points={line("test", run.points)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              className="stroke-iris"
            />
          ))}
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-meta text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-iris" />
          {labels.newExamples}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-3 bg-control-border" />
          {labels.training}
        </span>
      </p>
    </div>
  );
};

export default GrokkingThumbnail;
