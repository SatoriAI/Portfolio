import { useState } from "react";

import { MathText } from "@/components/Formula";
import { RangeInput } from "@/components/ui/range-input";
import {
  cellAverages,
  CELLS_DEFAULT,
  CELLS_MAX,
  CELLS_MIN,
  type GridReading,
  gridReading,
  keptPercent,
  seenWave,
  seenWaves,
  wave,
  WAVES,
} from "@/lib/gridAverages";
import { fillTemplate } from "@/lib/text";

export type AliasingLabels = {
  /** The legend: the wave, the cell averages, and the wave the grid sees. */
  wave: string;
  averages: string;
  seen: string;
  /** The slider's name, with `{n}` for the number of cells; may carry `$…$`. */
  spacing: string;
  fine: string;
  coarse: string;
  /** One sentence per reading; `{k}`, `{f}` and `{p}` are filled. */
  readings: Record<GridReading, string>;
};

const WIDTH = 400;
const HEIGHT = 168;
const MIDDLE = HEIGHT / 2;
const AMPLITUDE = 72;
/** Points along the drawn curves: smooth at five oscillations, at any width. */
const SAMPLES = 400;

const xAt = (x: number) => x * WIDTH;
const yAt = (value: number) => MIDDLE - value * AMPLITUDE;

const curve = (f: (x: number) => number) =>
  Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = i / SAMPLES;
    return `${i === 0 ? "M" : "L"}${xAt(x).toFixed(2)} ${yAt(f(x)).toFixed(2)}`;
  }).join("");

/** The input wave never changes, so its path is drawn once. */
const WAVE_PATH = curve((x) => wave(x));

/**
 * A fine wave on a periodic grid of cell averages, with the grid's spacing h
 * as the reader's control. On a fine grid the averages follow the wave; as
 * the cells grow towards the wave's own scale the averages shrink, and past
 * it they trace a slower wave (dashed) that the grid cannot tell from the
 * real one; on a grid whose cells each hold whole oscillations every average
 * is zero. All exact: see lib/gridAverages. The drawing is a fixed viewBox
 * scaled to the column, and its state is the slider's alone, so the page the
 * build wrote and the browser's first render are the same. Nothing moves on
 * its own.
 */
const AliasingFigure = ({ labels }: { labels: AliasingLabels }) => {
  // The slider runs from the finest grid to the coarsest: right is a larger h.
  const [cells, setCells] = useState(CELLS_DEFAULT);
  const averages = cellAverages(cells);
  const reading = gridReading(WAVES, cells);
  const sentence = (key: GridReading) =>
    fillTemplate(labels.readings[key], {
      k: WAVES,
      f: seenWaves(WAVES, cells),
      p: keptPercent(WAVES, cells),
    });
  const h = 1 / cells;

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        {averages.map((average, j) => (
          <rect
            key={`bar-${j}`}
            x={xAt(j * h)}
            width={xAt(h)}
            y={Math.min(yAt(average), MIDDLE)}
            height={Math.abs(yAt(average) - MIDDLE)}
            className="fill-iris/15"
          />
        ))}
        {/* The cell walls: the grid itself, h apart. */}
        {Array.from({ length: cells + 1 }, (_, j) => (
          <line
            key={`wall-${j}`}
            x1={xAt(j * h)}
            x2={xAt(j * h)}
            y1={MIDDLE - AMPLITUDE - 6}
            y2={MIDDLE + AMPLITUDE + 6}
            className="stroke-control-border/50"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={0}
          x2={WIDTH}
          y1={MIDDLE}
          y2={MIDDLE}
          className="stroke-control-border"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={WAVE_PATH}
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={curve((x) => seenWave(x, cells))}
          fill="none"
          className="stroke-iris"
          strokeWidth={2}
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
        {averages.map((average, j) => (
          <line
            key={`average-${j}`}
            x1={xAt(j * h)}
            x2={xAt((j + 1) * h)}
            y1={yAt(average)}
            y2={yAt(average)}
            className="stroke-primary"
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-foreground/80">
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 shrink-0 bg-muted-foreground" />
          {labels.wave}
        </li>
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className="h-[2.5px] w-6 shrink-0 bg-primary" />
          {labels.averages}
        </li>
        <li className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-0.5 w-6 shrink-0 bg-[repeating-linear-gradient(90deg,hsl(var(--iris))_0_6px,transparent_6px_10px)]"
          />
          {labels.seen}
        </li>
      </ul>

      {/* Every sentence shares one grid cell and only the current one shows,
          so the cell is as tall as the longest and the slider under it never
          jumps. Screen readers hear the sentence as the slider's value. */}
      <div aria-hidden="true" className="mt-6 grid text-base font-medium text-foreground">
        {(Object.keys(labels.readings) as GridReading[]).map((key) => (
          <p key={key} className={`col-start-1 row-start-1 ${key === reading ? "" : "invisible"}`}>
            {sentence(key)}
          </p>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="font-mono text-meta tracking-wide text-foreground">
          <MathText text={fillTemplate(labels.spacing, { n: cells })} />
        </span>
        <RangeInput
          aria-label={fillTemplate(labels.spacing, { n: cells }).replace(/\$/g, "")}
          min={0}
          max={CELLS_MAX - CELLS_MIN}
          step={1}
          value={CELLS_MAX - cells}
          onChange={(event) => setCells(CELLS_MAX - Number(event.target.value))}
          valueText={`h = 1/${cells}. ${sentence(reading)}`}
        />
        <span className="flex justify-between text-xs text-muted-foreground">
          <span>{labels.fine}</span>
          <span>{labels.coarse}</span>
        </span>
      </label>
    </div>
  );
};

export default AliasingFigure;
