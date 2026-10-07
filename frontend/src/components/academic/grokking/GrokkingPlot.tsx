import { type Ref, useEffect, useId, useRef } from "react";

import { MARGIN, type PlotGeometry } from "@/components/academic/grokking/geometry";
import { SeenMark, UnseenMark } from "@/components/academic/grokking/marks";
import type { GuessPhase } from "@/components/academic/grokking/use-guess-and-read";
import { useLatest } from "@/hooks/use-latest";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { GROKKING_CROSSING, GROKKING_RUNS, GROKKING_STEPS, measuredPath } from "@/lib/grokking";

/**
 * The plot itself, drawn in CSS pixels at the measured width: the accuracy
 * gridlines, the step axis, the band where every run passed 50% on new
 * examples (once answered), the crosshair at the read step, the reader's
 * dashed guess, and the three runs with their marks. The new examples are
 * hidden until the reader has guessed; while the phase is "drawing" the plot
 * draws them in, left to right at an even pace over the steps, so the delay,
 * which is the finding, passes as time (at once under reduced motion), and
 * calls `onDrawn` when they are.
 */

const DRAW_MS = 2800;

type GrokkingPlotProps = {
  geometry: PlotGeometry;
  /** The step read out; its marks grow and its label is inked. */
  step: number;
  guess: number;
  phase: GuessPhase;
  onDrawn: () => void;
  formatStep: (step: number) => string;
  formatPercent: (value: number) => string;
  /** The guess's dashed line, which the chart nudges once to show it moves. */
  markerRef: Ref<SVGLineElement>;
};

const GrokkingPlot = ({
  geometry: { width, height, x, y, tickEvery },
  step,
  guess,
  phase,
  onDrawn,
  formatStep,
  formatPercent,
  markerRef,
}: GrokkingPlotProps) => {
  const drawId = `${useId().replace(/:/g, "")}-draw`;
  const drawRef = useRef<SVGRectElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const done = useLatest(onDrawn);
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
      done.current();
      return;
    }
    sweep.onfinish = () => done.current();
    return () => sweep.cancel();
  }, [phase, prefersReducedMotion, done]);

  const guessing = phase === "guess";
  const answered = phase === "drawn";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
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
          (answered && (tick === GROKKING_CROSSING.min || tick === GROKKING_CROSSING.max)),
      ).map((tick) => (
        <text
          key={tick}
          x={x(tick)}
          y={height - MARGIN.bottom + 18}
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
          x={x(GROKKING_CROSSING.min)}
          y={MARGIN.top}
          width={x(GROKKING_CROSSING.max) - x(GROKKING_CROSSING.min)}
          height={height - MARGIN.bottom - MARGIN.top}
          className="fill-iris/10 duration-400 animate-in fade-in-0 motion-reduce:animate-none"
        />
      )}
      {!guessing && (
        <line
          x1={x(step)}
          x2={x(step)}
          y1={MARGIN.top - 6}
          y2={height - MARGIN.bottom}
          strokeWidth={1}
          className="stroke-foreground/40"
        />
      )}
      {/* The reader's guess: dashed, from its name down to the axis. It
          waits at step 0 to be moved, and is kept after the answer. */}
      <line
        ref={markerRef}
        x1={x(guess)}
        x2={x(guess)}
        y1={MARGIN.top - 10}
        y2={height - MARGIN.bottom}
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
              height={height}
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
        height={height}
        fill="transparent"
      />
    </svg>
  );
};

export default GrokkingPlot;
