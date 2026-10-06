import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { RotateCcw } from "lucide-react";

import FigureFrame from "@/components/academic/FigureFrame";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import {
  type Box,
  crossingRange,
  GROKKING_RUNS,
  GROKKING_STEPS,
  type GuessVerdict,
  guessVerdict,
  linearScale,
  measuredPath,
  type Metric,
  nearestStep,
  percentFormat,
  placeBeside,
  readoutAt,
  runSegments,
  type StepDescription,
  stepSentence,
  valuesAt,
} from "@/lib/grokking";
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

/** The top margin holds the guess's name, above the 100% line, clear of every line. */
const MARGIN = { left: 44, right: 24, top: 46, bottom: 30 };
/**
 * The chart asks before it answers. At first it shows only the examples seen
 * in training, already at 100% by step 1000, and asks the reader from which
 * step the model will handle new ones: the reader sets a marker, on the plot
 * or with the slider in the chart's first row, and presses Check; there is
 * no marker, and nothing to check, until the reader has chosen. Then the
 * new examples are drawn in, left to right at an even pace over the steps,
 * so the delay, which is the finding, passes as time. The chart answers on
 * itself, not in a sentence: a pale band marks the steps between which every
 * run passed 50% on new examples, and the marker, which stays, is graded
 * beside its name (spot on inside the band, almost within a thousand steps
 * of it, off otherwise); a screen reader hears the same in a sentence, and
 * while guessing the plot is a slider that says each step itself. The
 * crosshair then stands
 * at the guess, focus stays in the chart, and the reader can guess again.
 * From then on the first row reads out any step, as before. That row keeps one
 * height throughout, the tallest of everything it will hold, so nothing
 * under it moves. With reduced motion the new examples appear at once. The
 * page asks the question over the chart and gives the finding under it.
 */
const DRAW_MS = 2800;
/** The guess moves in half-thousands: finer than the measurements, no finer. */
const GUESS_STEP = 500;
/** The marker's one lean to the right and back, to show it can be moved. */
const NUDGE_PX = 28;
const NUDGE_MS = 900;
const OPENING_STEP = 1000;
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

/** The plot's width in CSS pixels, so text in the SVG stays at its set size. */
const useWidth = <T extends HTMLElement>(fallback: number) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
};

type MarkProps = {
  x: number;
  y: number;
  /** A mark at the selected step, grown a little so the step reads in the plot. */
  active?: boolean;
};

// Grown about its own centre, within the kit's 160–200 ms for hover feedback.
const markMotion = (active: boolean) =>
  cn(
    "origin-center transition-transform duration-200 ease-brand [transform-box:fill-box] motion-reduce:transition-none",
    active && "scale-[1.35]",
  );

const SeenMark = ({ x, y, active = false }: MarkProps) => (
  <rect
    x={x - 5}
    y={y - 5}
    width={10}
    height={10}
    strokeWidth={1.5}
    className={cn("fill-none stroke-control-border", markMotion(active))}
  />
);

const UnseenMark = ({ x, y, active = false }: MarkProps) => (
  <circle
    cx={x}
    cy={y}
    r={4}
    strokeWidth={2}
    className={cn("fill-iris stroke-card", markMotion(active))}
  />
);

const GrokkingChart = ({ labels, locale, className }: GrokkingChartProps) => {
  const { ref, width } = useWidth<HTMLDivElement>(560);
  const [step, setStep] = useState(OPENING_STEP);
  const [showTip, setShowTip] = useState(false);
  const keyRef = useRef<HTMLUListElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [keyBox, setKeyBox] = useState<Box | null>(null);
  const [tipSize, setTipSize] = useState<{ width: number; height: number } | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const drawId = `${useId().replace(/:/g, "")}-draw`;
  const drawRef = useRef<SVGRectElement>(null);
  // The reader's guess, then the new examples drawing in, then all drawn.
  const [phase, setPhase] = useState<"guess" | "drawing" | "drawn">("guess");
  // The guess starts at step 0, where the marker waits to be moved; nothing
  // can be checked until the reader has moved it.
  const [guess, setGuess] = useState(0);
  const [picked, setPicked] = useState(false);
  const markerLine = useRef<SVGLineElement>(null);
  const markerTag = useRef<HTMLSpanElement>(null);
  // Whether the reader has moved the read-out since the answer: until then it
  // stays quiet, so the grade is heard first.
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    if (phase !== "drawing") return;
    const sweep = prefersReducedMotion
      ? null
      : drawRef.current?.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
          duration: DRAW_MS,
          easing: "linear",
          fill: "forwards",
        });
    if (!sweep) {
      setPhase("drawn");
      return;
    }
    sweep.onfinish = () => setPhase("drawn");
    return () => sweep.cancel();
  }, [phase, prefersReducedMotion]);

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
    // set what the key and the tooltip say; showing mounts the tooltip.
  }, [showTip, step, width, labels, locale]);

  const stepMax = GROKKING_STEPS[GROKKING_STEPS.length - 1];
  const x = linearScale(0, stepMax, MARGIN.left, width - MARGIN.right);
  // Wide and low across the section; a little taller on a phone, where the
  // plot is narrow and a flat one would bury the rise.
  const plotHeight = width < 640 ? 272 : 252;
  const y = linearScale(0, 1, plotHeight - MARGIN.bottom, MARGIN.top);
  const stepAt = linearScale(MARGIN.left, width - MARGIN.right, 0, stepMax);
  // Every other step when a phone leaves too little room between labels.
  const tickEvery = x(GROKKING_STEPS[1]) - x(GROKKING_STEPS[0]) < 48 ? 2 : 1;

  const formatStep = new Intl.NumberFormat(locale).format;
  const formatPercent = percentFormat(locale).format;

  const guessing = phase === "guess";
  const toGuess = (value: number) =>
    Math.min(stepMax, Math.max(0, Math.round(value / GUESS_STEP) * GUESS_STEP));
  const pointAt = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const at = stepAt(event.clientX - bounds.left);
    if (guessing) {
      // A press or a drag moves the marker; a mouse only hovering leaves it.
      // The press captures the pointer, so the drag goes on off the plot.
      if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
      if (event.type === "pointerdown" || event.buttons === 1) {
        setGuess(toGuess(at));
        setPicked(true);
      }
      return;
    }
    setMoved(true);
    setStep(nearestStep(GROKKING_STEPS, at));
    setShowTip(true);
  };
  // A mouse that leaves takes the tooltip with it. A lifted finger leaves the
  // plot too, but a tap's tooltip should stay to be read, until focus moves on.
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") setShowTip(false);
  };
  // Focus from the keyboard shows the tooltip; focus from a click does not,
  // or it would outstay the pointer.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!guessing && event.currentTarget.matches(":focus-visible")) setShowTip(true);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setShowTip(false);
      return;
    }
    if (guessing) {
      if (event.key === "Enter") {
        event.preventDefault();
        check();
        return;
      }
      const notch =
        event.key === "ArrowRight" ? GUESS_STEP : event.key === "ArrowLeft" ? -GUESS_STEP : 0;
      if (event.key !== "Home" && event.key !== "End" && notch === 0) return;
      event.preventDefault();
      // From the latest guess, however fast the keys come.
      setGuess((now) =>
        event.key === "Home" ? 0 : event.key === "End" ? stepMax : toGuess(now + notch),
      );
      setPicked(true);
      return;
    }
    setMoved(true);
    const index = GROKKING_STEPS.indexOf(step);
    const last = GROKKING_STEPS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? Math.min(last, index + 1)
        : event.key === "ArrowLeft"
          ? Math.max(0, index - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setStep(GROKKING_STEPS[next]);
    setShowTip(true);
  };

  // The selected step, and only it, in words; rounded as the tooltip rounds.
  const note = stepSentence(labels.stepNote, GROKKING_RUNS, step, locale);
  const answered = phase === "drawn";

  // The first time the chart is mostly in view, the marker and its name
  // lean right and come back, once, so the reader sees they can be moved.
  // Not after a move, and not under reduced motion.
  const nudged = useRef(false);
  useEffect(() => {
    const plot = ref.current;
    if (!plot || prefersReducedMotion || picked || nudged.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        nudged.current = true;
        const lean = { duration: NUDGE_MS, delay: 300, easing: "cubic-bezier(0.45, 0, 0.55, 1)" };
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
      { threshold: 0.6 },
    );
    observer.observe(plot);
    return () => observer.disconnect();
  }, [ref, prefersReducedMotion, picked]);
  const crossing = crossingRange(GROKKING_RUNS);
  const grade = guessVerdict(guess, crossing);
  // While guessing, the name says it can be moved.
  const markerName = answered
    ? `${labels.predict.marker} · ${labels.predict.verdict[grade]}`
    : `↔ ${labels.predict.marker}`;
  const guessText = labels.predict.guess.replace("{step}", formatStep(guess));
  // The slider itself says each step while the reader chooses; this voice
  // gives only the grade, so nothing is heard twice.
  const heard = answered
    ? `${labels.predict.verdict[grade]}. ${labels.predict.result
        .replace("{from}", formatStep(crossing.min))
        .replace("{to}", formatStep(crossing.max))}`
    : "";
  // Check keeps focus in the chart, which it is about to answer, and stands
  // the crosshair at the guess.
  const check = () => {
    if (!picked) return;
    ref.current?.focus();
    setStep(nearestStep(GROKKING_STEPS, guess));
    setPhase("drawing");
  };
  const retry = () => {
    ref.current?.focus();
    setGuess(0);
    setPicked(false);
    setMoved(false);
    setShowTip(false);
    setStep(OPENING_STEP);
    setPhase("guess");
  };
  const howId = `${drawId}-how`;
  // Every read-out the row can show, laid under it unseen, so the row is as
  // tall as the longest of them at this width and never grows.
  const allNotes = GROKKING_STEPS.map((tick) =>
    stepSentence(labels.stepNote, GROKKING_RUNS, tick, locale),
  );

  const series: { metric: Metric; name: string; Mark: typeof UnseenMark }[] = [
    { metric: "test", name: labels.unseen, Mark: UnseenMark },
    { metric: "train", name: labels.seen, Mark: SeenMark },
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
          onPointerMove={pointAt}
          onPointerDown={pointAt}
          onPointerLeave={onPointerLeave}
          onFocus={onFocus}
          onBlur={() => setShowTip(false)}
          onKeyDown={onKeyDown}
          // The chart convention for pointing at data. The reading itself
          // snaps to the nearest of the seven measured steps, which the
          // crosshair line, the grown marks and the inked step label show.
          className={cn(
            "relative mt-1 rounded-motif focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            // A drag across the plot moves the marker and selects nothing.
            guessing ? "cursor-ew-resize select-none" : "cursor-crosshair",
          )}
        >
          <svg
            width={width}
            height={plotHeight}
            viewBox={`0 0 ${width} ${plotHeight}`}
            className="block h-auto w-full"
            aria-hidden="true"
          >
            {[0, 0.5, 1].map((value) => (
              <g key={value}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(value)}
                  y2={y(value)}
                  strokeWidth={1}
                  className={value === 0 ? "stroke-control-border" : "stroke-border"}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(value)}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={11}
                  className="fill-muted-foreground font-mono"
                >
                  {formatPercent(value)}
                </text>
              </g>
            ))}
            {/* The selected step's label is always drawn, in ink, even where a
                phone thins the axis to every other step: its neighbours are
                then two steps away and there is room for it. */}
            {GROKKING_STEPS.filter(
              (tick, index) =>
                index % tickEvery === 0 ||
                tick === step ||
                (answered && (tick === crossing.min || tick === crossing.max)),
            ).map((tick) => (
              <text
                key={tick}
                x={x(tick)}
                y={plotHeight - MARGIN.bottom + 18}
                textAnchor="middle"
                fontSize={11}
                className={
                  !guessing && tick === step
                    ? "fill-foreground font-mono font-medium"
                    : "fill-muted-foreground font-mono"
                }
              >
                {formatStep(tick)}
              </text>
            ))}

            {/* Where every run passed 50% on new examples: the answer the guess
                is graded against, drawn once the lines are. */}
            {answered && (
              <rect
                x={x(crossing.min)}
                y={MARGIN.top}
                width={x(crossing.max) - x(crossing.min)}
                height={plotHeight - MARGIN.bottom - MARGIN.top}
                className="fill-iris/10 duration-400 animate-in fade-in-0 motion-reduce:animate-none"
              />
            )}
            {!guessing && (
              <line
                x1={x(step)}
                x2={x(step)}
                y1={MARGIN.top - 6}
                y2={plotHeight - MARGIN.bottom}
                strokeWidth={1}
                className="stroke-foreground/40"
              />
            )}
            {/* The reader's guess: dashed, from its name down to the axis. It
                waits at step 0 to be moved, and is kept after the answer. */}
            <line
              ref={markerLine}
              x1={x(guess)}
              x2={x(guess)}
              y1={MARGIN.top - 10}
              y2={plotHeight - MARGIN.bottom}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              className="stroke-iris"
            />

            {phase !== "drawn" && (
              <defs>
                <clipPath id={drawId}>
                  {/* From just left of the first step, so its marks show whole. */}
                  <rect
                    ref={drawRef}
                    x={MARGIN.left - 8}
                    y={0}
                    width={Math.max(0, width - MARGIN.left - MARGIN.right + 16)}
                    height={plotHeight}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "left",
                      transform: "scaleX(0)",
                    }}
                  />
                </clipPath>
              </defs>
            )}
            {GROKKING_RUNS.map((run) => (
              <path
                key={`train-${run.seed}`}
                d={measuredPath(run.points, "train", x, y)}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                className="stroke-control-border"
              />
            ))}
            {/* The new examples, hidden until the reader has guessed. */}
            <g clipPath={phase !== "drawn" ? `url(#${drawId})` : undefined}>
              {GROKKING_RUNS.map((run) => (
                <path
                  key={`test-${run.seed}`}
                  d={measuredPath(run.points, "test", x, y)}
                  fill="none"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  className="stroke-iris"
                />
              ))}
              {/* Circles first, squares over them: at 100% both series meet and
                the hollow square frames the circle instead of hiding it. */}
              {GROKKING_RUNS.flatMap((run) =>
                run.points.map((p) => (
                  <UnseenMark
                    key={`t${run.seed}-${p.step}`}
                    x={x(p.step)}
                    y={y(p.test)}
                    active={!guessing && p.step === step}
                  />
                )),
              )}
            </g>
            {GROKKING_RUNS.flatMap((run) =>
              run.points.map((p) => (
                <SeenMark
                  key={`s${run.seed}-${p.step}`}
                  x={x(p.step)}
                  y={y(p.train)}
                  active={!guessing && p.step === step}
                />
              )),
            )}

            {/* The whole plot answers the pointer, not only the thin marks. */}
            <rect
              x={MARGIN.left}
              y={0}
              width={Math.max(0, width - MARGIN.left - MARGIN.right)}
              height={plotHeight}
              fill="transparent"
            />
          </svg>

          {/* The guess's name, above the 100% line where no line goes, always
              on its line: an outline while guessing (grab it, or drag
              anywhere on the plot), then filled by its grade. Centred on the
              marker, or held inside the plot near either end. */}
          <span
            ref={markerTag}
            aria-hidden="true"
            // The size joined by hand: cn would read text-meta as a colour
            // beside text-white and drop it.
            className={`font-mono text-meta ${cn(
              "pointer-events-none absolute whitespace-nowrap rounded-lg border px-2 py-0.5 transition-colors duration-200",
              !answered
                ? "border-iris bg-card text-iris"
                : grade === "perfect"
                  ? "border-iris bg-iris text-white"
                  : grade === "almost"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground bg-muted-foreground text-white",
            )}`}
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

          {/* The key, in the corner the lines have left empty. Its surface
              hides the crosshair as it passes, so the names stay whole. */}
          <ul
            ref={keyRef}
            className="pointer-events-none absolute space-y-1 bg-card text-sm text-foreground"
            style={{
              right: MARGIN.right,
              bottom: MARGIN.bottom + KEY_INSET,
              maxWidth: width - MARGIN.right - x(KEY_FROM_STEP) - KEY_INSET,
            }}
          >
            {series
              .filter(({ metric }) => answered || metric !== "test")
              .map(({ metric, name, Mark }) => (
                <li key={metric} className="flex items-start gap-2">
                  <svg viewBox="0 0 12 12" className="mt-1 size-3 shrink-0" aria-hidden="true">
                    <Mark x={6} y={6} />
                  </svg>
                  <span>{name}</span>
                </li>
              ))}
          </ul>

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
              {series.map(({ metric, Mark }) => (
                <p
                  key={metric}
                  className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] tabular-nums leading-4 text-foreground"
                >
                  <svg viewBox="0 0 12 12" className="size-3 shrink-0" aria-hidden="true">
                    <Mark x={6} y={6} />
                  </svg>
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
          <table className="sr-only">
            <caption>{labels.title}</caption>
            <thead>
              <tr>
                <th scope="col">{labels.step}</th>
                <th scope="col">{labels.run}</th>
                <th scope="col">{labels.seen}</th>
                <th scope="col">{labels.unseen}</th>
              </tr>
            </thead>
            <tbody>
              {GROKKING_STEPS.flatMap((tick) =>
                GROKKING_RUNS.map((run, index) => {
                  const point = run.points.find((p) => p.step === tick);
                  return (
                    <tr key={`${tick}-${run.seed}`}>
                      <td>{formatStep(tick)}</td>
                      <td>{index + 1}</td>
                      <td>{point ? formatPercent(point.train) : ""}</td>
                      <td>{point ? formatPercent(point.test) : ""}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
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
