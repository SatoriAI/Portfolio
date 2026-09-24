import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

/**
 * A labelled figure of the object the research is about.
 *
 * The Neumann heat kernel on the segment [0, π] has the cosine expansion
 *
 *   K_t(x, y) = 1/π + (2/π) Σ e^(−n²t) cos(nx) cos(ny),
 *
 * which is the kernel the bachelor's thesis estimated. Four curves show it
 * for a fixed y at increasing t: heat placed at one point spreads out and
 * flattens towards the mean, 1/π, which is drawn as the dashed line. A sharp
 * estimate — the subject of the two papers, there on cones rather than a
 * segment — bounds a kernel like this one above and below by the same
 * expression up to constants.
 *
 * The series is truncated at n = 60; at the smallest t drawn the dropped
 * terms are below e^(−72). The curves draw themselves when the figure enters
 * the viewport and stand still under reduced motion.
 */

const TIMES = [0.02, 0.1, 0.5, 2] as const;
const SOURCE = 1.0;
/**
 * Where each curve's label sits, as an x on the curve. The two flat kernels
 * peak within a few pixels of each other, so their labels move right along
 * the curve to where the two have separated.
 */
const LABEL_X: Record<(typeof TIMES)[number], number> = { 0.02: 1.08, 0.1: 1.12, 0.5: 1.4, 2: 2.6 };
const TERMS = 60;
const SAMPLES = 160;

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
const py = (k: number) => PLOT.bottom - (k / K_MAX) * (PLOT.bottom - PLOT.top);

const curvePath = (t: number): string =>
  Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = (i / SAMPLES) * Math.PI;
    return `${i === 0 ? "M" : "L"}${px(x).toFixed(1)} ${py(kernel(x, SOURCE, t)).toFixed(1)}`;
  }).join(" ");

type HeatKernelFigureLabels = {
  /** Accessible name of the figure. */
  figure: string;
  caption: string;
};

type HeatKernelFigureProps = {
  labels: HeatKernelFigureLabels;
  /** BCP 47 tag for the decimal separator in the time labels. */
  locale: string;
  className?: string;
};

const HeatKernelFigure = ({ labels, locale, className }: HeatKernelFigureProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLElement>();
  const animate = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animate || isRevealed;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  return (
    <figure ref={ref} aria-label={labels.figure} className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        {/* Axis and the mean every kernel tends to. */}
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
          {/* At the left end: at the right it sat beside the flattest curve's label. */}
          <text x={PLOT.left} y={py(1 / Math.PI) - 4} textAnchor="start">
            1/π
          </text>
        </g>

        {/* The kernels, sharpest first, each drawn on a 700ms brand ease. */}
        {TIMES.map((t, index) => (
          <path
            key={t}
            d={curvePath(t)}
            fill="none"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={1}
            style={animate ? { transitionDelay: `${index * 120}ms` } : undefined}
            className={cn(
              "stroke-iris",
              animate && "transition-[stroke-dashoffset] duration-700 ease-brand",
              drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
            )}
          />
        ))}
        <g className="fill-foreground font-mono" fontSize={10}>
          {TIMES.map((t) => (
            <text
              key={t}
              x={px(LABEL_X[t]) + 4}
              y={py(kernel(LABEL_X[t], SOURCE, t)) - 5}
              textAnchor="start"
            >
              t = {format.format(t)}
            </text>
          ))}
        </g>
      </svg>
      <figcaption className="mt-4 max-w-[60ch] font-mono text-meta text-muted-foreground">
        {labels.caption}
      </figcaption>
    </figure>
  );
};

export default HeatKernelFigure;
