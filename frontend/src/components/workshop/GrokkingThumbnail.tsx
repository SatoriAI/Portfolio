import { useLayoutEffect, useRef, useState } from "react";

import { GROKKING_RUNS, GROKKING_STEPS } from "@/lib/grokking";
import { cn } from "@/lib/utils";

/**
 * The grokking piece's measurement in small: accuracy over training steps
 * for the three runs, training in grey and new examples in iris, with the
 * delay between them shaded and named. Still, with no pointer: the reading of
 * single values belongs to the Research page's chart, and this one only shows
 * the shape the piece is about. Drawn in pixels at the width it is given, so
 * its labels stay at the kit's sizes on a phone and at 1440 alike.
 */

const HEIGHT = 190;
const PAD = { left: 36, right: 8, top: 10, bottom: 24 };
const LAST_STEP = GROKKING_STEPS[GROKKING_STEPS.length - 1];

/** From the step every run knows its training data to the step every run passes 50% on new data. */
const firstStepWhere = (test: (values: number[]) => boolean, metric: "train" | "test") =>
  GROKKING_STEPS.find((step) =>
    test(GROKKING_RUNS.map((run) => run.points.find((point) => point.step === step)![metric])),
  ) ?? LAST_STEP;
const DELAY_FROM = firstStepWhere((values) => values.every((v) => v >= 0.99), "train");
const DELAY_TO = firstStepWhere((values) => values.every((v) => v >= 0.5), "test");

export type GrokkingThumbnailLabels = {
  newExamples: string;
  training: string;
  delay: string;
};

const GrokkingThumbnail = ({ labels }: { labels: GrokkingThumbnailLabels }) => {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const x = (step: number) => PAD.left + ((width - PAD.left - PAD.right) * step) / LAST_STEP;
  const y = (value: number) => PAD.top + (HEIGHT - PAD.top - PAD.bottom) * (1 - value);
  const line = (metric: "train" | "test", points: (typeof GROKKING_RUNS)[number]["points"]) =>
    points.map((point) => `${x(point.step)},${y(point[metric])}`).join(" ");

  return (
    <div ref={box} aria-hidden="true">
      {width > 0 && (
        <svg width={width} height={HEIGHT} className="block overflow-visible">
          <rect
            x={x(DELAY_FROM)}
            y={y(1)}
            width={x(DELAY_TO) - x(DELAY_FROM)}
            height={y(0) - y(1)}
            // Its edges turn iris when the row it sits in is pointed at (the
            // workshop index's reading of a result); still elsewhere.
            className="fill-blush stroke-transparent transition-colors duration-200 group-focus-within/piece:stroke-iris group-hover/piece:stroke-iris motion-reduce:transition-none"
            strokeWidth={1.5}
          />
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
