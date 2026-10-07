import FigureFrame from "@/components/academic/FigureFrame";
import { RangeInput } from "@/components/ui/range-input";
import { bandPath, boundPoints, LOWER, timeAt, toPath, UPPER } from "@/lib/kernelFigures";

type FigureLabels = {
  label: string;
  figure: string;
  yAxis: string;
  xAxis: string;
  upper: string;
  between: string;
  lower: string;
  caption: string;
};

type ControlLabels = { time: string; start: string; later: string };

const PLOT = { left: 8, right: 392, top: 10, bottom: 200 };

type FigureProps = { labels: FigureLabels; position: number };

/**
 * What a sharp estimate is, drawn: a lower and an upper bound of the same
 * shape, one a fixed multiple of the other, with the unknown exact value
 * somewhere between. Moving time changes both by the same rule — the point
 * of the figure. They are drawn well apart: sharp means the right shape, not
 * a narrow band. Everything follows the slider, set beside the prose;
 * nothing moves on its own.
 */
const SharpBoundsFigure = ({ labels, position }: FigureProps) => {
  const time = timeAt(position);

  return (
    <FigureFrame kind="illustration" label={labels.label}>
      <figure aria-label={labels.figure}>
        <p className="mb-2 text-xs text-muted-foreground">{labels.yAxis}</p>
        <svg viewBox="0 0 400 210" className="block h-auto w-full" aria-hidden="true">
          <path d={bandPath(time, PLOT)} className="fill-iris/15" />
          <path
            d={toPath(boundPoints(UPPER, time, PLOT))}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.25}
          />
          <path
            d={toPath(boundPoints(LOWER, time, PLOT))}
            fill="none"
            className="stroke-iris"
            strokeWidth={2.25}
          />
          <line
            x1={PLOT.left}
            y1={PLOT.bottom}
            x2={PLOT.right}
            y2={PLOT.bottom}
            className="stroke-control-border"
          />
          <line
            x1={PLOT.left}
            y1={PLOT.top}
            x2={PLOT.left}
            y2={PLOT.bottom}
            className="stroke-control-border"
          />
        </svg>
        <p className="mt-1 text-right text-xs text-muted-foreground">{labels.xAxis}</p>

        {/* The two bounds share one line; what lies between them has its own. */}
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-foreground/80">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[2.5px] w-6 shrink-0 bg-iris" />
            {labels.lower}
          </li>
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[2.5px] w-6 shrink-0 bg-primary" />
            {labels.upper}
          </li>
          <li className="flex basis-full items-center gap-3">
            <span aria-hidden="true" className="h-3 w-6 shrink-0 bg-iris/15" />
            {labels.between}
          </li>
        </ul>

        <figcaption className="mt-6 text-sm text-foreground/80">{labels.caption}</figcaption>
      </figure>
    </FigureFrame>
  );
};

type ControlsProps = {
  labels: ControlLabels;
  position: number;
  onPositionChange: (position: number) => void;
};

/** The time that both bounds follow. */
export const SharpBoundsControls = ({ labels, position, onPositionChange }: ControlsProps) => (
  <label className="block">
    <span className="font-mono text-meta tracking-wide text-foreground">{labels.time}</span>
    <RangeInput
      aria-label={labels.time}
      min={0}
      max={1}
      step={0.005}
      value={position}
      onChange={(event) => onPositionChange(Number(event.target.value))}
      valueText={`${Math.round(position * 100)}%`}
    />
    <span className="flex justify-between text-xs text-muted-foreground">
      <span>{labels.start}</span>
      <span>{labels.later}</span>
    </span>
  </label>
);

export default SharpBoundsFigure;
