import FigureFrame from "@/components/academic/FigureFrame";
import { MathText } from "@/components/Formula";
import { RangeInput } from "@/components/ui/range-input";
import {
  B,
  defect,
  evaluate,
  gradientProduct,
  type GradientReading,
  gradientReading,
  type Modes,
  relativeGap,
  timeAt,
  U,
} from "@/lib/hiddenGradient";
import { fillTemplate } from "@/lib/text";

export type HiddenGradientLabels = {
  label: string;
  /** What the figure shows, for assistive technology. */
  figure: string;
  b: string;
  u: string;
  target: string;
  defect: string;
  /** One sentence per reading; `{p}` is the gap in percent. */
  readings: Record<GradientReading, string>;
  caption: string;
};

export type HiddenGradientControlLabels = {
  /** The slider's label; `{t}` is the time, and it may carry `$…$`. */
  time: string;
  /** The slider's accessible name, without the value its value text carries. */
  timeName: string;
  longer: string;
  shorter: string;
};

/** The two plots share one width; each has its own height and room for its strokes. */
const WIDTH = 400;
const INPUTS = { top: 8, bottom: 92 };
const RESULT = { top: 8, bottom: 152 };
const SAMPLES = 200;

const TARGET = gradientProduct();
/** The result plot's scale: b′·u′'s largest value, with room for the defect's overshoot. */
const SCALE = Math.max(
  ...Array.from({ length: SAMPLES + 1 }, (_, i) => Math.abs(evaluate(TARGET, i / SAMPLES))),
);

type Plot = { top: number; bottom: number };

/** The curve's points across the loop, with the plot's middle at zero and `scale` at its edge. */
const points = (f: Modes, plot: Plot, scale: number) => {
  const middle = (plot.top + plot.bottom) / 2;
  const half = (plot.bottom - plot.top) / 2;
  return Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = i / SAMPLES;
    return [x * WIDTH, middle - (evaluate(f, x) / scale) * half] as const;
  });
};

const path = (list: readonly (readonly [number, number])[]) =>
  list.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");

const curve = (f: Modes, plot: Plot, scale: number) => path(points(f, plot, scale));

/** The region between two curves on one plot: the gap the slider closes. */
const between = (f: Modes, g: Modes, plot: Plot, scale: number) =>
  `${path([...points(f, plot, scale), ...points(g, plot, scale).reverse()])}Z`;

const axis = (plot: Plot) => (plot.top + plot.bottom) / 2;

const percent = (position: number) => Math.round(relativeGap(timeAt(position)) * 100);

const sentence = (labels: HiddenGradientLabels, position: number) => {
  const gap = relativeGap(timeAt(position));
  return fillTemplate(labels.readings[gradientReading(gap)], { p: Math.round(gap * 100) });
};

/**
 * Two functions on a loop, b and u, and what the two orders of diffusion and
 * multiplication make of them: multiply then diffuse, or diffuse then
 * multiply. The difference, divided by 2t, is drawn over b′·u′ with the gap
 * between them shaded; as the diffusion time t shrinks the gap closes. Every
 * curve is computed exactly from the functions' Fourier modes (see
 * lib/hiddenGradient). Everything follows the slider, set beside the prose;
 * nothing moves on its own.
 */
const HiddenGradientFigure = ({
  labels,
  position,
}: {
  labels: HiddenGradientLabels;
  position: number;
}) => {
  const approximation = defect(timeAt(position));
  const reading = gradientReading(relativeGap(timeAt(position)));
  return (
    <FigureFrame kind="illustration" label={labels.label}>
      <figure aria-label={labels.figure}>
        <svg viewBox={`0 0 ${WIDTH} 100`} className="block h-auto w-full" aria-hidden="true">
          <line
            x1={0}
            x2={WIDTH}
            y1={axis(INPUTS)}
            y2={axis(INPUTS)}
            className="stroke-control-border"
          />
          <path
            d={curve(B, INPUTS, 1.6)}
            fill="none"
            className="stroke-muted-foreground"
            strokeWidth={1.5}
          />
          <path d={curve(U, INPUTS, 1.6)} fill="none" className="stroke-iris" strokeWidth={1.5} />
        </svg>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-foreground/80">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[1.5px] w-6 shrink-0 bg-muted-foreground" />
            <MathText text={labels.b} />
          </li>
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[1.5px] w-6 shrink-0 bg-iris" />
            <MathText text={labels.u} />
          </li>
        </ul>

        <svg viewBox={`0 0 ${WIDTH} 160`} className="mt-6 block h-auto w-full" aria-hidden="true">
          <path d={between(approximation, TARGET, RESULT, SCALE)} className="fill-iris/15" />
          <line
            x1={0}
            x2={WIDTH}
            y1={axis(RESULT)}
            y2={axis(RESULT)}
            className="stroke-control-border"
          />
          <path
            d={curve(TARGET, RESULT, SCALE)}
            fill="none"
            className="stroke-muted-foreground"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <path
            d={curve(approximation, RESULT, SCALE)}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
          />
        </svg>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-foreground/80">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[2.5px] w-6 shrink-0 bg-primary" />
            <MathText text={labels.defect} />
          </li>
          <li className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-[1.5px] w-6 shrink-0 bg-[repeating-linear-gradient(90deg,hsl(var(--muted-foreground))_0_5px,transparent_5px_9px)]"
            />
            <MathText text={labels.target} />
          </li>
        </ul>

        {/* Every sentence shares one grid cell and only the current one shows,
            so the cell is as tall as the longest and nothing under it jumps.
            Screen readers hear the sentence as the slider's value. */}
        <div aria-hidden="true" className="mt-6 grid text-base font-medium text-foreground">
          {(Object.keys(labels.readings) as GradientReading[]).map((key) => (
            <p
              key={key}
              className={`col-start-1 row-start-1 ${key === reading ? "" : "invisible"}`}
            >
              <MathText
                text={fillTemplate(labels.readings[key], {
                  p: key === reading ? percent(position) : 0,
                })}
              />
            </p>
          ))}
        </div>

        <figcaption className="mt-6 text-sm text-foreground/80">
          <MathText text={labels.caption} />
        </figcaption>
      </figure>
    </FigureFrame>
  );
};

type ControlsProps = {
  figureLabels: HiddenGradientLabels;
  labels: HiddenGradientControlLabels;
  /** The page's language, for the time's decimal separator. */
  locale: string;
  position: number;
  onPositionChange: (position: number) => void;
};

/** The diffusion time, from long on the left to short on the right. */
export const HiddenGradientControls = ({
  figureLabels,
  labels,
  locale,
  position,
  onPositionChange,
}: ControlsProps) => {
  const time = new Intl.NumberFormat(locale, {
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 2,
  }).format(timeAt(position));
  return (
    <label className="block">
      <span className="font-mono text-meta tracking-wide text-foreground">
        <MathText text={fillTemplate(labels.time, { t: time })} />
      </span>
      <RangeInput
        aria-label={labels.timeName}
        min={0}
        max={1}
        step={0.005}
        value={position}
        onChange={(event) => onPositionChange(Number(event.target.value))}
        valueText={`t = ${time}. ${sentence(figureLabels, position)}`}
      />
      <span className="flex justify-between text-xs text-muted-foreground">
        <span>{labels.longer}</span>
        <span>{labels.shorter}</span>
      </span>
    </label>
  );
};

export default HiddenGradientFigure;
