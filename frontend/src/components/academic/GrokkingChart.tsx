import { useId, useLayoutEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import FigureFrame from "@/components/academic/FigureFrame";
import { MARGIN } from "@/components/academic/grokking/geometry";
import GrokkingDataTable from "@/components/academic/grokking/GrokkingDataTable";
import GrokkingKey from "@/components/academic/grokking/GrokkingKey";
import GrokkingPlot from "@/components/academic/grokking/GrokkingPlot";
import { MarkSwatch } from "@/components/academic/grokking/marks";
import { useGuessAndRead } from "@/components/academic/grokking/useGuessAndRead";
import { Button } from "@/components/ui/button";
import { useElementSize } from "@/hooks/use-element-size";
import { useOnceInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import {
  type Box,
  crossingRange,
  GROKKING_RUNS,
  GROKKING_STEPS,
  type GuessVerdict,
  guessVerdict,
  linearScale,
  type Metric,
  percentFormat,
  placeBeside,
  readoutAt,
  runSegments,
  type StepDescription,
  stepSentence,
  valuesAt,
} from "@/lib/grokking";
import { EASE_TRAVEL } from "@/lib/motion";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * Grokking, measured: accuracy on the pairs a model trained on and on the
 * pairs it never saw, over the first 6000 steps of three training runs.
 *
 * Seen examples reach 100% by step 1000 while new ones sit near chance; two to
 * three thousand steps later the new ones follow. The chart is an emphasis
 * form — new examples in iris, seen ones in the de-emphasis grey, with a
 * second, shape encoding (filled circles, hollow squares) so identity never
 * rests on colour. The three runs share a style, since the run is not what a
 * reader is asked to tell apart. Points are the logged evaluations, joined by
 * straight segments and nothing smoother, because nothing was measured in
 * between.
 *
 * A sentence directly over the plot says in words what the step the
 * crosshair marks shows, from all three runs at that step and no other. Its
 * values are computed, never typed into the copy, and its wording follows
 * the data: one value for both measures, studied fixed while new ones vary,
 * or both varying. It opens on step 1000, the gap the section is about, and
 * follows the pointer, a tap, or the arrow keys. The key sits inside the plot,
 * in its lower-right corner, which is empty because every run has risen by
 * then. The values themselves, one per run or one for all when every run
 * shows the same, appear in a tooltip beside the
 * crosshair only while the reader points at, taps or focuses the plot, and
 * Escape puts it away. It is set clear of the lines wherever the plot leaves
 * room: on a desktop, everywhere but beside step 0, where the grey rise runs
 * through every place it could stand. Where nothing is clear, as on a phone,
 * it gives way in order: it never hides the points it reads out, keeps off
 * the key where it can, and crosses as few lines as it can. The full data is
 * also a table for screen readers.
 *
 * How the runs were made and measured is the caption, under the plot and
 * across the card, where a reader looks for it after the result.
 */

/** The marker's one lean to the right and back, to show it can be moved. */
const NUDGE_PX = 28;
const NUDGE_MS = 900;
/**
 * The key keeps right of this step, where every run is at 80% or more
 * (grokking.test.ts holds the data to that), so the corner under the lines
 * is empty. On a phone the key wraps rather than reach back over the rise.
 */
const KEY_FROM_STEP = 3000;
/** Air between the key and the axis, and between the key and the rise. */
const KEY_INSET = 8;

const sameBox = (a: Box, b: Box) =>
  a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;

export type GrokkingChartLabels = {
  /** Stands in the frame's top edge, and names the figure. */
  title: string;
  /** Series names. */
  seen: string;
  unseen: string;
  /** Axis titles. */
  stepAxis: string;
  accuracyAxis: string;
  /** Single words for the table's headers: "Step", "Run". */
  step: string;
  run: string;
  /**
   * The selected step in words: one template per shape its data can take
   * across the runs, filled from that step alone. The placeholders are
   * `stepSentence`'s, in lib/grokking.ts.
   */
  stepNote: Readonly<Record<StepDescription["kind"], string>>;
  /** The caption, under the plot: how the runs were made and measured. */
  caption: string;
  /** The guess before the new examples are shown; see the note on `DRAW_MS`. */
  predict: {
    /** `{step}` is replaced. */
    guess: string;
    marker: string;
    check: string;
    /** In place of the guess until the marker has been moved. */
    drag: string;
    /** The slider's value, to a screen reader, until then. */
    none: string;
    /** How to guess, for a screen reader. */
    how: string;
    /** Starts over, after the answer. */
    retry: string;
    /** The grade set beside the marker's name once the answer is drawn. */
    verdict: Readonly<Record<GuessVerdict, string>>;
    /** Read to a screen reader after the grade; `{from}` and `{to}` are replaced. */
    result: string;
  };
};

type GrokkingChartProps = {
  labels: GrokkingChartLabels;
  /** BCP 47 tag for number formatting. */
  locale: string;
  className?: string;
};

const GrokkingChart = ({ labels, locale, className }: GrokkingChartProps) => {
  // The plot's width in CSS pixels, so text in the SVG stays at its set size.
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(ref, { width: 560, height: 0 });
  const keyRef = useRef<HTMLUListElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [keyBox, setKeyBox] = useState<Box | null>(null);
  const [tipSize, setTipSize] = useState<{ width: number; height: number } | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const drawId = `${useId().replace(/:/g, "")}-draw`;
  const drawRef = useRef<SVGRectElement>(null);
  const markerLine = useRef<SVGLineElement>(null);
  const markerTag = useRef<HTMLSpanElement>(null);

  const stepMax = GROKKING_STEPS[GROKKING_STEPS.length - 1];
  const x = linearScale(0, stepMax, MARGIN.left, width - MARGIN.right);
  // Wide and low across the section; a little taller on a phone, where the
  // plot is narrow and a flat one would bury the rise.
  const plotHeight = width < 640 ? 272 : 252;
  const y = linearScale(0, 1, plotHeight - MARGIN.bottom, MARGIN.top);
  const stepAt = linearScale(MARGIN.left, width - MARGIN.right, 0, stepMax);
  // Every other step when a phone leaves too little room between labels.
  const tickEvery = x(GROKKING_STEPS[1]) - x(GROKKING_STEPS[0]) < 48 ? 2 : 1;

  const { phase, step, guess, picked, moved, showTip, check, retry, plotHandlers } =
    useGuessAndRead({ plotRef: ref, drawRef, stepMax, stepAt, prefersReducedMotion });
  const guessing = phase === "guess";
  const answered = phase === "drawn";

  // The key and the tooltip are measured whenever what sizes them changes, so
  // the tooltip can be set clear of both the lines and the key. State changes
  // only when a measurement does, and the layout effect lands before paint.
  useLayoutEffect(() => {
    const key = keyRef.current;
    if (key) {
      const box = {
        left: key.offsetLeft,
        top: key.offsetTop,
        right: key.offsetLeft + key.offsetWidth,
        bottom: key.offsetTop + key.offsetHeight,
      };
      setKeyBox((previous) => (previous && sameBox(previous, box) ? previous : box));
    }
    const tip = tipRef.current;
    if (tip) {
      const size = { width: tip.offsetWidth, height: tip.offsetHeight };
      setTipSize((previous) =>
        previous && previous.width === size.width && previous.height === size.height
          ? previous
          : size,
      );
    }
    // The width places and wraps the key; the step, the labels and the locale
    // set what the key and the tooltip say; showing mounts the tooltip;
    // the answer adds the new examples to the key.
  }, [showTip, step, width, labels, locale, answered]);

  const formatStep = new Intl.NumberFormat(locale).format;
  const formatPercent = percentFormat(locale).format;

  // The selected step, and only it, in words; rounded as the tooltip rounds.
  const note = stepSentence(labels.stepNote, GROKKING_RUNS, step, locale);

  // The first time the chart is mostly in view, the marker and its name
  // lean right and come back, once, so the reader sees they can be moved.
  // Not after a move, and not under reduced motion.
  useOnceInView(
    ref,
    () => {
      const lean = { duration: NUDGE_MS, delay: 300, easing: EASE_TRAVEL };
      markerLine.current?.animate(
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${NUDGE_PX}px)` },
          { transform: "translateX(0)" },
        ],
        lean,
      );
      markerTag.current?.animate(
        [{ translate: "0 0" }, { translate: `${NUDGE_PX}px 0` }, { translate: "0 0" }],
        lean,
      );
    },
    { threshold: 0.6, enabled: !prefersReducedMotion && !picked },
  );
  const crossing = crossingRange(GROKKING_RUNS);
  const grade = guessVerdict(guess, crossing);
  // While guessing, the name says it can be moved.
  const markerName = answered
    ? `${labels.predict.marker} · ${labels.predict.verdict[grade]}`
    : `↔ ${labels.predict.marker}`;
  const guessText = fillTemplate(labels.predict.guess, { step: formatStep(guess) });
  // The slider itself says each step while the reader chooses; this voice
  // gives only the grade, so nothing is heard twice.
  const heard = answered
    ? `${labels.predict.verdict[grade]}. ${fillTemplate(labels.predict.result, { from: formatStep(crossing.min), to: formatStep(crossing.max) })}`
    : "";
  const howId = `${drawId}-how`;
  // Every read-out the row can show, laid under it unseen, so the row is as
  // tall as the longest of them at this width and never grows.
  const allNotes = GROKKING_STEPS.map((tick) =>
    stepSentence(labels.stepNote, GROKKING_RUNS, tick, locale),
  );

  const series: { metric: Metric; name: string }[] = [
    { metric: "test", name: labels.unseen },
    { metric: "train", name: labels.seen },
  ];

  // Until the tooltip has been measured once it is drawn unseen, so it never
  // shows in the wrong place. The marks at the step it describes come before
  // the key: on a phone neither side of the crosshair may have room, and the
  // tooltip must never hide the very points it reads out.
  const marksAtStep = (["train", "test"] as const).flatMap((metric) =>
    valuesAt(GROKKING_RUNS, step, metric).map((value) => ({
      left: x(step) - 6,
      top: y(value) - 6,
      right: x(step) + 6,
      bottom: y(value) + 6,
    })),
  );
  const tipAt =
    showTip && tipSize
      ? placeBeside({
          anchor: x(step),
          ...tipSize,
          bounds: { left: 0, top: 0, right: width, bottom: plotHeight - MARGIN.bottom },
          segments: runSegments(GROKKING_RUNS, x, y),
          obstacles: keyBox ? [keyBox] : [],
          keepVisible: marksAtStep,
        })
      : null;

  return (
    <FigureFrame kind="measurement" label={labels.title}>
      <figure aria-label={labels.title} className={cn("w-full", className)}>
        {/* The first row, one height throughout: before the answer, the
            guess and Check; after, what the marked step shows, in words,
            directly over the plot. Everything it can hold shares one grid
            cell, the unused unseen, so the cell is as tall as the tallest. */}
        <div className="mt-2 grid">
          {allNotes.map((text, index) => (
            <p
              key={GROKKING_STEPS[index]}
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 text-base"
            >
              {text}
            </p>
          ))}
          <div
            className={cn(
              "col-start-1 row-start-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-3",
              !guessing && "invisible",
            )}
            aria-hidden={!guessing}
          >
            <p className="font-mono text-meta tracking-wide text-foreground">
              {picked ? guessText : labels.predict.drag}
            </p>
            <Button type="button" disabled={!guessing || !picked} onClick={check}>
              {labels.predict.check}
            </Button>
          </div>
          <p className="sr-only" aria-live="polite">
            {heard}
          </p>
          <p id={howId} className="sr-only">
            {labels.predict.how}
          </p>
          <p
            className={cn(
              "col-start-1 row-start-1 self-start text-base text-foreground",
              guessing && "invisible",
            )}
            aria-live={moved ? "polite" : "off"}
          >
            {guessing ? "" : note}
          </p>
        </div>

        {/* The axis title, and after the answer a way to guess again at the
            row's other end: outside the plot, so it never meets the guess's
            name, and in a row that is always there, so nothing moves. */}
        <div className="mt-4 flex h-5 items-center justify-between gap-4">
          <p
            className="whitespace-nowrap font-mono text-meta text-muted-foreground"
            aria-hidden="true"
          >
            {labels.accuracyAxis}
          </p>
          {answered && (
            <button
              type="button"
              onClick={retry}
              // 44px to press, as the kit asks of controls, in a 20px row:
              // the padding reaches past the row and the margin takes it back.
              className="-my-3 flex items-center gap-1.5 whitespace-nowrap rounded-lg py-3 font-mono text-meta text-iris transition-colors duration-200 hover:text-foreground"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              {labels.predict.retry}
            </button>
          )}
        </div>
        <div
          ref={ref}
          tabIndex={0}
          // While guessing, the plot is the slider that moves the marker.
          role={guessing ? "slider" : "group"}
          aria-label={guessing ? labels.predict.marker : labels.title}
          aria-valuemin={guessing ? 0 : undefined}
          aria-valuemax={guessing ? stepMax : undefined}
          aria-valuenow={guessing ? guess : undefined}
          aria-valuetext={guessing ? (picked ? guessText : labels.predict.none) : undefined}
          aria-describedby={guessing ? howId : undefined}
          // While guessing, a sideways drag moves the guess and an upward
          // one still scrolls the page.
          style={guessing ? { touchAction: "pan-y" } : undefined}
          {...plotHandlers}
          // The chart convention for pointing at data. The reading itself
          // snaps to the nearest of the seven measured steps, which the
          // crosshair line, the grown marks and the inked step label show.
          className={cn(
            "relative mt-1 rounded-motif focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            // A drag across the plot moves the marker and selects nothing.
            guessing ? "cursor-ew-resize select-none" : "cursor-crosshair",
          )}
        >
          <GrokkingPlot
            width={width}
            height={plotHeight}
            x={x}
            y={y}
            step={step}
            guess={guess}
            phase={phase}
            crossing={crossing}
            tickEvery={tickEvery}
            formatStep={formatStep}
            formatPercent={formatPercent}
            drawId={drawId}
            drawRef={drawRef}
            markerRef={markerLine}
          />

          {/* The guess's name, above the 100% line where no line goes, always
              on its line: an outline while guessing (grab it, or drag
              anywhere on the plot), then filled by its grade. Centred on the
              marker, or held inside the plot near either end. */}
          <span
            ref={markerTag}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute whitespace-nowrap rounded-lg border px-2 py-0.5 font-mono text-meta transition-colors duration-200",
              !answered
                ? "border-iris bg-card text-iris"
                : grade === "perfect"
                  ? "border-iris bg-iris text-white"
                  : grade === "almost"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground bg-muted-foreground text-white",
            )}
            style={{
              left: x(guess),
              top: 6,
              transform:
                guess < stepMax * 0.2
                  ? "translateX(-12px)"
                  : guess > stepMax * 0.8
                    ? "translateX(calc(-100% + 12px))"
                    : "translateX(-50%)",
            }}
          >
            {markerName}
          </span>

          <GrokkingKey
            ref={keyRef}
            series={series.filter(({ metric }) => answered || metric !== "test")}
            style={{
              right: MARGIN.right,
              bottom: MARGIN.bottom + KEY_INSET,
              maxWidth: width - MARGIN.right - x(KEY_FROM_STEP) - KEY_INSET,
            }}
          />

          {/* The values at the marked step, one per run, marked as the key
              marks them. The step itself is on the axis under the crosshair
              and in the sentence above, which also says the values in words
              to a screen reader. Set at the tick labels' size: it is chart
              text, and small enough to fit between the lines where the runs
              part, at steps 1000 and 2000. It fades in once, then jumps
              with the crosshair: `duration-200` alone would also tween its
              position, sliding it over the marks it must keep clear of. */}
          {showTip && (
            <div
              ref={tipRef}
              aria-hidden="true"
              className="pointer-events-none absolute z-10 space-y-1 rounded-xl border border-border bg-card px-3 py-2 shadow-md transition-none duration-200 animate-in fade-in-0 motion-reduce:animate-none"
              style={
                tipAt
                  ? { left: tipAt.left, top: tipAt.top }
                  : { left: 0, top: 0, visibility: "hidden" }
              }
            >
              {series.map(({ metric }) => (
                <p
                  key={metric}
                  className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] tabular-nums leading-4 text-foreground"
                >
                  <MarkSwatch metric={metric} />
                  {readoutAt(GROKKING_RUNS, step, metric, formatPercent).join(" · ")}
                </p>
              ))}
            </div>
          )}
        </div>
        <p className="mt-1 text-right font-mono text-meta text-muted-foreground" aria-hidden="true">
          {labels.stepAxis}
        </p>

        {!guessing && (
          <GrokkingDataTable
            labels={labels}
            formatStep={formatStep}
            formatPercent={formatPercent}
          />
        )}

        {/* Last in the figure, as a caption must be first or last; the table
            before it is for screen readers only, so on screen the caption
            follows the axis title. It runs the card's full width. */}
        <figcaption className="mt-4 text-sm text-muted-foreground">{labels.caption}</figcaption>
      </figure>
    </FigureFrame>
  );
};

export default GrokkingChart;
