import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A labelled, live figure of the object the research is about.
 *
 * The Neumann heat kernel on the segment [0, π] has the cosine expansion
 *
 *   K_t(x, y) = 1/π + (2/π) Σ e^(−n²t) cos(nx) cos(ny),
 *
 * which is the kernel the bachelor's thesis estimated. The figure shows it for
 * a fixed y at a time t the visitor controls: a scrubber runs t from 0.02 to
 * 2, and the curve is recomputed from the series at every step. Heat placed
 * at one point spreads and flattens towards the mean, 1/π, drawn as the dashed
 * line. Four reference times stay as hairlines so the path of the collapse is
 * visible at a glance. A sharp estimate — the subject of the two papers, there
 * on cones rather than a segment — bounds a kernel like this one above and
 * below by the same expression up to constants.
 *
 * The time is reported outward through `onTimeChange`; the Research page hands
 * it to the heat field behind its header, so the plot and the background are
 * the same equation at the same t. The figure runs once from t = 0.02 to 2 on
 * mount, then waits; under reduced motion it starts at rest and moves only
 * when the visitor moves it.
 *
 * The series is truncated at n = 60; at t = 0.02 the dropped terms are below
 * e^(−72). The scrubber is logarithmic in t, since the interesting part of the
 * collapse happens in the first tenth of the range.
 */

// 0.02 rather than 0.01: at 0.01 the peak stands above the plot and clips flat.
const T_MIN = 0.02;
const T_MAX = 2;
const REFERENCE_TIMES = [0.02, 0.1, 0.5, 2] as const;
const SOURCE = 1.0;
const TERMS = 60;
const SAMPLES = 160;
const PLAY_MS = 3200;

const WIDTH = 400;
const HEIGHT = 240;
const PLOT = { left: 12, right: 388, top: 20, bottom: 208 };
const K_MAX = 2.2;

const kernel = (x: number, y: number, t: number): number => {
  let sum = 1 / Math.PI;
  for (let n = 1; n <= TERMS; n++) {
    sum += (2 / Math.PI) * Math.exp(-n * n * t) * Math.cos(n * x) * Math.cos(n * y);
  }
  return sum;
};

const px = (x: number) => PLOT.left + (x / Math.PI) * (PLOT.right - PLOT.left);
const py = (k: number) => PLOT.bottom - (Math.min(k, K_MAX) / K_MAX) * (PLOT.bottom - PLOT.top);

const curvePath = (t: number): string =>
  Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = (i / SAMPLES) * Math.PI;
    return `${i === 0 ? "M" : "L"}${px(x).toFixed(1)} ${py(kernel(x, SOURCE, t)).toFixed(1)}`;
  }).join(" ");

// The scrubber's position is log t, so equal drags are equal ratios of time.
const toSlider = (t: number) => Math.log(t / T_MIN) / Math.log(T_MAX / T_MIN);
const fromSlider = (u: number) => T_MIN * Math.pow(T_MAX / T_MIN, u);
const easeOut = (u: number) => 1 - (1 - u) ** 2;

const REFERENCE_PATHS = REFERENCE_TIMES.map((t) => curvePath(t));

type HeatKernelFigureLabels = {
  /** Accessible name of the figure. */
  figure: string;
  caption: string;
  /** One plain sentence on what to notice, set before the formal caption. */
  lead?: string;
  /** The play control. */
  play: string;
  /** The scrubber's label, e.g. "time t". */
  time: string;
};

type HeatKernelFigureProps = {
  labels: HeatKernelFigureLabels;
  /** BCP 47 tag for the decimal separator in the time readout. */
  locale: string;
  /** Called with every t the figure shows. */
  onTimeChange?: (t: number) => void;
  className?: string;
};

const HeatKernelFigure = ({ labels, locale, onTimeChange, className }: HeatKernelFigureProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [t, setT] = useState(prefersReducedMotion ? T_MAX : T_MIN);
  const frameRef = useRef<number | null>(null);
  const onTimeChangeRef = useRef(onTimeChange);
  onTimeChangeRef.current = onTimeChange;

  useEffect(() => {
    onTimeChangeRef.current?.(t);
  }, [t]);

  const stop = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const play = () => {
    stop();
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / PLAY_MS);
      setT(fromSlider(easeOut(progress)));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else frameRef.current = null;
    };
    frameRef.current = requestAnimationFrame(step);
  };

  // Once on mount: the figure sits in the page header and is on screen
  // already, so this is the section's entrance rather than a loop.
  useEffect(() => {
    if (!prefersReducedMotion) play();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScrub = (event: ChangeEvent<HTMLInputElement>) => {
    stop();
    setT(fromSlider(Number(event.target.value)));
  };

  const format = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const peak = { x: px(SOURCE), y: py(kernel(SOURCE, SOURCE, t)) };

  return (
    <figure aria-label={labels.figure} className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        <line
          x1={PLOT.left}
          y1={PLOT.bottom}
          x2={PLOT.right}
          y2={PLOT.bottom}
          className="stroke-control-border"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {[0, 0.5, 1].map((fraction) => (
          <line
            key={fraction}
            x1={px(fraction * Math.PI)}
            y1={PLOT.bottom}
            x2={px(fraction * Math.PI)}
            y2={PLOT.bottom + 5}
            className="stroke-control-border"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={PLOT.left}
          y1={py(1 / Math.PI)}
          x2={PLOT.right}
          y2={py(1 / Math.PI)}
          className="stroke-control-border"
          strokeWidth={1}
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
        <g className="fill-muted-foreground font-mono" fontSize={10}>
          <text x={px(0)} y={PLOT.bottom + 18} textAnchor="start">
            0
          </text>
          <text x={px(Math.PI / 2)} y={PLOT.bottom + 18} textAnchor="middle">
            π/2
          </text>
          <text x={px(Math.PI)} y={PLOT.bottom + 18} textAnchor="end">
            π
          </text>
          <text x={PLOT.left} y={py(1 / Math.PI) - 4} textAnchor="start">
            1/π
          </text>
        </g>

        {/* Reference times, as hairlines: the path the collapse takes. */}
        {REFERENCE_PATHS.map((d, index) => (
          <path
            key={REFERENCE_TIMES[index]}
            d={d}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-border"
          />
        ))}

        {/* The kernel now. */}
        <path
          d={curvePath(t)}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          className="stroke-iris"
        />
        <circle cx={peak.x} cy={peak.y} r={4} className="fill-primary" />
        <text
          x={peak.x + 8}
          y={Math.max(peak.y - 6, PLOT.top)}
          className="fill-foreground font-mono"
          fontSize={10}
        >
          t = {format.format(t)}
        </text>
      </svg>

      <div className="mt-4 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={play} className="shrink-0">
          <Play />
          {labels.play}
        </Button>
        <label className="flex min-w-0 flex-1 items-center gap-3 font-mono text-meta text-muted-foreground">
          <span className="shrink-0">{labels.time}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={toSlider(t)}
            onChange={onScrub}
            aria-valuetext={`t = ${format.format(t)}`}
            className={cn(
              "h-6 w-full min-w-0 cursor-pointer appearance-none bg-transparent",
              "[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-control-border",
              "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-motif [&::-webkit-slider-thumb]:bg-primary",
              "[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-control-border",
              "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-motif [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
              "focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring focus-visible:[&::-webkit-slider-thumb]:ring-offset-2",
            )}
          />
        </label>
      </div>
      <figcaption className="mt-4 max-w-[48ch] text-sm text-muted-foreground">
        {labels.lead && <span className="mb-2 block text-base text-foreground">{labels.lead}</span>}
        {labels.caption}
      </figcaption>
    </figure>
  );
};

export default HeatKernelFigure;
