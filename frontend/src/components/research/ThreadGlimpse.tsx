import {
  B,
  defect,
  evaluate,
  gradientProduct,
  type Modes,
  timeAt as gradientTime,
} from "@/lib/hiddenGradient";
import {
  bandPath,
  boundPoints,
  BOUNDS_START,
  LOWER,
  timeAt as kernelTime,
  toPath,
  UPPER,
} from "@/lib/kernelFigures";
import type { ResearchSlug } from "@/lib/researchThreads";

/**
 * A still glimpse of each thread's figure for its row on the Research index:
 * the same drawing as the thread's own figure, at one telling moment, with no
 * labels or control, so the row says what the thread looks like before it is
 * opened. Decorative: the row's title and question carry its meaning.
 */

const WIDTH = 400;
const HEIGHT = 140;

/** The sharp bounds: two bounds of one shape, the unknown between them. */
const Bounds = () => {
  const plot = { left: 8, right: WIDTH - 8, top: 10, bottom: HEIGHT - 6 };
  const time = kernelTime(BOUNDS_START);
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-full w-full" aria-hidden="true">
      <path d={bandPath(time, plot)} className="fill-iris/15" />
      <path
        d={toPath(boundPoints(UPPER, time, plot))}
        fill="none"
        className="stroke-primary"
        strokeWidth={2.25}
      />
      <path
        d={toPath(boundPoints(LOWER, time, plot))}
        fill="none"
        className="stroke-iris"
        strokeWidth={2.25}
      />
      <line
        x1={plot.left}
        x2={plot.right}
        y1={plot.bottom}
        y2={plot.bottom}
        className="stroke-control-border"
      />
    </svg>
  );
};

const curve = (f: Modes, scale: number, middle: number, half: number) =>
  Array.from({ length: 161 }, (_, i) => {
    const x = i / 160;
    return `${i === 0 ? "M" : "L"}${(x * WIDTH).toFixed(1)} ${(middle - (evaluate(f, x) / scale) * half).toFixed(1)}`;
  }).join("");

/** The hidden gradient part-way: the two orders' difference closing on b′·u′. */
const Gradient = () => {
  const target = gradientProduct();
  const approximation = defect(gradientTime(0.45));
  const scale = Math.max(
    ...Array.from({ length: 161 }, (_, i) => Math.abs(evaluate(target, i / 160))),
  );
  const middle = HEIGHT / 2;
  const half = HEIGHT / 2 - 8;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-full w-full" aria-hidden="true">
      <line x1={0} x2={WIDTH} y1={middle} y2={middle} className="stroke-control-border" />
      <path
        d={curve(target, scale, middle, half)}
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <path
        d={curve(approximation, scale, middle, half)}
        fill="none"
        className="stroke-primary"
        strokeWidth={2.5}
      />
      <path
        d={curve(B, 1.6, middle, half)}
        fill="none"
        className="stroke-iris/40"
        strokeWidth={1.25}
      />
    </svg>
  );
};

/** The rod: one section heated, region A marked further along it. */
const Rod = () => (
  <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="glimpse-rod-heat" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" className="[stop-color:hsl(var(--iris))]" stopOpacity={0} />
        <stop offset="35%" className="[stop-color:hsl(var(--iris))]" stopOpacity={0.9} />
        <stop offset="65%" className="[stop-color:hsl(var(--iris))]" stopOpacity={0.9} />
        <stop offset="100%" className="[stop-color:hsl(var(--iris))]" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect
      x={8}
      y={52}
      width={WIDTH - 16}
      height={36}
      rx={18}
      className="fill-card stroke-control-border"
    />
    <rect x={70} y={52} width={110} height={36} fill="url(#glimpse-rod-heat)" />
    <path d={`M282 100 V108 H342 V100`} fill="none" className="stroke-iris" strokeWidth={1.5} />
    <text x={312} y={126} textAnchor="middle" className="fill-iris font-mono text-[13px]">
      A
    </text>
  </svg>
);

/**
 * The delay: accuracy on the training examples rises early, on new examples
 * much later; the steps between are shaded in blush, as the workshop's chart
 * marks them. A shape, not a measurement: the thread's own chart has the runs.
 */
const Delay = () => {
  const plot = { left: 8, right: WIDTH - 8, top: 14, bottom: HEIGHT - 14 };
  const rise = (at: number, steep: number) => (x: number) => 1 / (1 + Math.exp(-(x - at) * steep));
  const line = (f: (x: number) => number) =>
    Array.from({ length: 121 }, (_, i) => {
      const x = i / 120;
      const px = plot.left + x * (plot.right - plot.left);
      const py = plot.bottom - f(x) * (plot.bottom - plot.top);
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join("");
  const at = (x: number) => plot.left + x * (plot.right - plot.left);
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-full w-full" aria-hidden="true">
      <rect
        x={at(0.24)}
        width={at(0.6) - at(0.24)}
        y={plot.top}
        height={plot.bottom - plot.top}
        // Dark blush reads brown on the lavender glimpse; the deeper tone the
        // heat field glows with in dark keeps the band pink.
        className="fill-blush dark:fill-blush-deep"
      />
      <line
        x1={plot.left}
        x2={plot.right}
        y1={plot.bottom}
        y2={plot.bottom}
        className="stroke-control-border"
      />
      <path
        d={line(rise(0.14, 34))}
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth={1.75}
      />
      <path d={line(rise(0.66, 24))} fill="none" className="stroke-primary" strokeWidth={2.5} />
    </svg>
  );
};

const ThreadGlimpse = ({ slug }: { slug: ResearchSlug }) => {
  if (slug === "generalisation") return <Delay />;
  if (slug === "heat-kernels") return <Bounds />;
  if (slug === "neural-operators") return <Gradient />;
  return <Rod />;
};

export default ThreadGlimpse;
