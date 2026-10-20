import { useRef, useState } from "react";

import { MathText } from "@/components/Formula";
import { RangeInput } from "@/components/ui/range-input";
import { useElementSize } from "@/hooks/use-element-size";
import {
  bandEdge,
  cellAverages,
  CELLS_DEFAULT,
  CELLS_MAX,
  CELLS_MIN,
  type GridReading,
  gridReading,
  keptPercent,
  seenWave,
  seenWaves,
  symbolRatio,
  wave,
  WAVES,
} from "@/lib/gridAverages";
import { fillTemplate } from "@/lib/text";

export type AliasingLabels = {
  /** The legend: the wave, the cell averages, and the wave the grid sees. */
  wave: string;
  averages: string;
  seen: string;
  /** The slider's label, with `{n}` for the number of cells; may carry `$…$`. */
  spacing: string;
  /** The slider's accessible name, without the value its value text carries. */
  spacingName: string;
  fine: string;
  coarse: string;
  /** One sentence per reading; `{k}`, `{f}` and `{p}` are filled. */
  readings: Record<GridReading, string>;
  /** The second panel: how the grid's operator acts on each oscillation. */
  symbol: SymbolLabels;
};

export type SymbolLabels = {
  /** The axes; may carry `$…$`. */
  yAxis: string;
  xAxis: string;
  continuous: string;
  discrete: string;
  /** The figure's own wave, marked on the curve. */
  marker: string;
  beyond: string;
  /** The level every grid's curve ends on; `{e}` is filled. */
  edge: string;
  /** `{r}` the wave's share, `{e}` the share at the band's edge. */
  readings: Record<SymbolReading, string>;
};

type SymbolReading = "within" | "edge" | "beyond";

/** Points along the drawn curves: smooth at five oscillations, at any width. */
const SAMPLES = 400;

/**
 * Both drawings are laid out in pixels at the width they are given, so a
 * wider column shows more of the wave rather than thicker lines. Their
 * heights are fixed by the layout (CSS, so the page the build writes holds
 * the room) and capped, so at 1440 × 900 each plot, its readout and the
 * slider fit on one screen.
 */
const WAVE_BOX = "h-[132px] sm:h-[160px] lg:h-[176px]";
const SYMBOL_BOX = "h-[112px] sm:h-[128px] lg:h-[136px]";
/** Room above and below the wave, in px, for the cell walls' overhang. */
const WAVE_INSET = 6;
/** Room above the symbol plot's 100% line, for the dot at the top. */
const SYMBOL_INSET = 6;

/** The second panel's frequencies run to the finest grid's limit, 15. */
const L_MAX = bandEdge(CELLS_MAX);
/** The share left at the band's edge, 4/π², the same on every grid. */
const EDGE_PERCENT = Math.round((4 / Math.PI ** 2) * 100);

const path = (points: (readonly [number, number])[]) =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");

/**
 * A box of its final height that draws its contents once it knows its width:
 * empty in the page the build writes and in the browser's first render, so
 * the two agree, and drawn straight after, at the same height.
 */
const Measured = ({
  className,
  children,
}: {
  className: string;
  children: (size: { width: number; height: number }) => JSX.Element;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  return (
    <div ref={ref} className={className} aria-hidden="true">
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
};

/** The wave, its cell averages on an n-cell grid, and the wave the grid sees. */
const WavePlot = ({ cells, width, height }: { cells: number; width: number; height: number }) => {
  const middle = height / 2;
  const amplitude = middle - WAVE_INSET;
  const xAt = (x: number) => x * width;
  const yAt = (value: number) => middle - value * amplitude;
  const curve = (f: (x: number) => number) =>
    path(Array.from({ length: SAMPLES + 1 }, (_, i) => [xAt(i / SAMPLES), yAt(f(i / SAMPLES))]));
  const averages = cellAverages(cells);
  const h = 1 / cells;
  return (
    <svg width={width} height={height} className="block overflow-visible">
      {averages.map((average, j) => (
        <rect
          key={`bar-${j}`}
          x={xAt(j * h)}
          width={xAt(h)}
          y={Math.min(yAt(average), middle)}
          height={Math.abs(yAt(average) - middle)}
          className="fill-iris/15"
        />
      ))}
      {/* The cell walls: the grid itself, h apart. */}
      {Array.from({ length: cells + 1 }, (_, j) => (
        <line
          key={`wall-${j}`}
          x1={xAt(j * h)}
          x2={xAt(j * h)}
          y1={0}
          y2={height}
          className="stroke-control-border/50"
          strokeWidth={1}
        />
      ))}
      <line x1={0} x2={width} y1={middle} y2={middle} className="stroke-control-border" />
      <path
        d={curve((x) => wave(x))}
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth={1.25}
      />
      <path
        d={curve((x) => seenWave(x, cells))}
        fill="none"
        className="stroke-iris"
        strokeWidth={2}
        strokeDasharray="6 4"
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
        />
      ))}
    </svg>
  );
};

/**
 * How the operator on an n-cell grid acts on an oscillation with ℓ waves,
 * as a share of how the continuous operator acts on it (lib/gridAverages):
 * the continuous one is the line at 100%, the grid's curve falls below it as
 * ℓ grows and ends at the grid's limit of resolution, n/2, at 4/π². The gap
 * between them is shaded; beyond the limit the grid has no oscillations at
 * all. The figure's own wave is the dot.
 */
const SymbolPlot = ({ cells, width, height }: { cells: number; width: number; height: number }) => {
  const top = SYMBOL_INSET;
  const bottom = height - 1;
  const lAt = (l: number) => (l / L_MAX) * width;
  const ratioAt = (ratio: number) => bottom - ratio * (bottom - top);
  const edge = bandEdge(cells);
  const steps = Math.max(60, Math.round(width / 3));
  const line = path(
    Array.from({ length: steps + 1 }, (_, i) => {
      const l = (edge * i) / steps;
      return [lAt(l), ratioAt(symbolRatio(l, cells))] as const;
    }),
  );
  const gap = `${line}L${lAt(edge).toFixed(2)} ${ratioAt(1)}L0 ${ratioAt(1)}Z`;
  return (
    <svg width={width} height={height} className="block overflow-visible">
      <path d={gap} className="fill-iris/15" />
      <rect
        x={lAt(edge)}
        width={width - lAt(edge)}
        y={top}
        height={bottom - top}
        className="fill-control-border/10"
      />
      <line x1={lAt(edge)} x2={lAt(edge)} y1={top} y2={bottom} className="stroke-control-border" />
      {/* Where every grid's curve ends: 4/π² of the continuous operator. */}
      <line
        x1={0}
        x2={width}
        y1={ratioAt(EDGE_PERCENT / 100)}
        y2={ratioAt(EDGE_PERCENT / 100)}
        className="stroke-control-border"
        strokeDasharray="2 4"
      />
      <line x1={0} x2={width} y1={ratioAt(0)} y2={ratioAt(0)} className="stroke-control-border" />
      <line
        x1={0}
        x2={width}
        y1={ratioAt(1)}
        y2={ratioAt(1)}
        className="stroke-muted-foreground"
        strokeWidth={1.25}
      />
      <path d={line} fill="none" className="stroke-primary" strokeWidth={2.5} />
      <line
        x1={lAt(WAVES)}
        x2={lAt(WAVES)}
        y1={top}
        y2={bottom}
        className="stroke-iris"
        strokeDasharray="3 3"
      />
      {WAVES <= edge && (
        <circle
          cx={lAt(WAVES)}
          cy={ratioAt(symbolRatio(WAVES, cells))}
          r={4.5}
          className="fill-iris"
        />
      )}
    </svg>
  );
};

/**
 * A fine wave on a periodic grid of cell averages, with the grid's spacing h
 * as the reader's control. On a fine grid the averages follow the wave; as
 * the cells grow towards the wave's own scale the averages shrink, and past
 * it they trace a slower wave (dashed) that the grid cannot tell from the
 * real one; on a grid whose cells each hold whole oscillations every average
 * is zero. Under it, on the same slider, how the grid's own operator acts on
 * oscillations near its limit of resolution (SymbolPlot). All exact: see
 * lib/gridAverages. Both drawings are drawn in pixels at their measured
 * width (see Measured), and the state is the slider's alone, so the page the
 * build wrote and the browser's first render are the same. Nothing moves on
 * its own.
 */
const AliasingFigure = ({ labels }: { labels: AliasingLabels }) => {
  // The slider runs from the finest grid to the coarsest: right is a larger h.
  const [cells, setCells] = useState(CELLS_DEFAULT);
  const reading = gridReading(WAVES, cells);
  const sentence = (key: GridReading) =>
    fillTemplate(labels.readings[key], {
      k: WAVES,
      f: seenWaves(WAVES, cells),
      p: keptPercent(WAVES, cells),
    });
  // At the band's edge the wave's share is the edge's own, so it is said once.
  const symbolReading: SymbolReading =
    WAVES < bandEdge(cells) ? "within" : WAVES === bandEdge(cells) ? "edge" : "beyond";
  const symbolSentence = (key: SymbolReading) =>
    fillTemplate(labels.symbol.readings[key], {
      r: Math.round(symbolRatio(WAVES, cells) * 100),
      e: EDGE_PERCENT,
    });

  return (
    <div>
      <Measured className={WAVE_BOX}>
        {({ width, height }) => <WavePlot cells={cells} width={width} height={height} />}
      </Measured>

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

      <div className="mt-10">
        <p className="mb-2 text-xs text-muted-foreground">
          <MathText text={labels.symbol.yAxis} />
        </p>
        <Measured className={SYMBOL_BOX}>
          {({ width, height }) => <SymbolPlot cells={cells} width={width} height={height} />}
        </Measured>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          <MathText text={labels.symbol.xAxis} />
        </p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-foreground/80">
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 shrink-0 bg-muted-foreground" />
          {labels.symbol.continuous}
        </li>
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className="h-[2.5px] w-6 shrink-0 bg-primary" />
          {labels.symbol.discrete}
        </li>
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className="flex w-6 shrink-0 justify-center">
            <span className="size-2.5 rounded-full bg-iris" />
          </span>
          {labels.symbol.marker}
        </li>
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className="h-3 w-6 shrink-0 bg-control-border/10" />
          {labels.symbol.beyond}
        </li>
        <li className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-px w-6 shrink-0 bg-[repeating-linear-gradient(90deg,hsl(var(--control-border))_0_2px,transparent_2px_6px)]"
          />
          {fillTemplate(labels.symbol.edge, { e: EDGE_PERCENT })}
        </li>
      </ul>

      <div aria-hidden="true" className="mt-6 grid text-base font-medium text-foreground">
        {(Object.keys(labels.symbol.readings) as SymbolReading[]).map((key) => (
          <p
            key={key}
            className={`col-start-1 row-start-1 ${key === symbolReading ? "" : "invisible"}`}
          >
            {symbolSentence(key)}
          </p>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="font-mono text-meta tracking-wide text-foreground">
          <MathText text={fillTemplate(labels.spacing, { n: cells })} />
        </span>
        <RangeInput
          aria-label={labels.spacingName}
          min={0}
          max={CELLS_MAX - CELLS_MIN}
          step={1}
          value={CELLS_MAX - cells}
          onChange={(event) => setCells(CELLS_MAX - Number(event.target.value))}
          valueText={`h = 1/${cells}. ${sentence(reading)} ${symbolSentence(symbolReading)}`}
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
