import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Formula, MathText } from "@/components/Formula";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

/**
 * The cyclic group ℤ₁₁₃ and what a shift does to a Fourier mode.
 *
 * The 113 group elements stand on a circle. Over them is drawn one character
 * of the group, the mode k: the closed curve r(x) = R + A·cos(2πk(x − a)/113).
 * Pressing "shift" replaces a by a + 1 — the group acting on itself — and the
 * curve turns rigidly, because a shift of the argument is a change of phase,
 *
 *   e^(2πik(x+a)/113) = e^(2πika/113) · e^(2πikx/113),
 *
 * and nothing else. That is the fact the grokking project rests on: an
 * operator that commutes with the shifts cannot mix one mode with another,
 * so it must carry each Fourier component to itself. The phase 2πka/113 is
 * printed, with ka reduced mod 113, which is the arithmetic the model learns.
 *
 * On first sight the figure assembles itself — the ring draws, the 113
 * elements appear in order round it, the mode draws over them — and then
 * turns once through a full cycle before waiting for the visitor. Under
 * reduced motion it stands, complete, still.
 */

const N = 113;
const SIZE = 320;
const C = SIZE / 2;
const R = 112;
const AMPLITUDE = 22;
/**
 * Modes k and 113 − k draw the same curve mirrored, so every distinct shape
 * is reached by k from 1 to 56.
 */
const K_MIN = 1;
const K_MAX = 56;
const HOLD_DELAY_MS = 400;
const HOLD_REPEAT_MS = 90;
const SHIFT_MS = 400;
const TOUR_MS = 3600;
const ASSEMBLE_MS = 900;
const ELEMENT_STAGGER_MS = 4;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

const point = (angle: number, radius: number) => ({
  x: C + radius * Math.sin(angle),
  y: C - radius * Math.cos(angle),
});

const modePath = (k: number, shift: number): string => {
  const steps = 360;
  return (
    Array.from({ length: steps + 1 }, (_, i) => {
      const x = (i / steps) * N;
      const radius = R + AMPLITUDE * Math.cos((2 * Math.PI * k * (x - shift)) / N);
      const { x: px, y: py } = point((2 * Math.PI * x) / N, radius);
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ") + " Z"
  );
};

const ELEMENTS = Array.from({ length: N }, (_, x) => point((2 * Math.PI * x) / N, R));

export type CyclicShiftFigureLabels = {
  /** Accessible name of the figure. */
  figure: string;
  caption: string;
  /** Heading of the mode stepper. */
  mode: string;
  /** Heading of the shift stepper. */
  shiftGroup: string;
  /** Accessible names of the four arrows. */
  modeDown: string;
  modeUp: string;
  shiftDown: string;
  shiftUp: string;
};

type CyclicShiftFigureProps = {
  labels: CyclicShiftFigureLabels;
  className?: string;
};

type StepperProps = {
  heading: string;
  /** The value, set as a formula, e.g. `k = 8`. */
  value: string;
  onStep: (direction: -1 | 1) => void;
  downLabel: string;
  upLabel: string;
  canStepDown?: boolean;
  canStepUp?: boolean;
};

/**
 * Arrows either side of a live value. Holding an arrow repeats it after a
 * short delay, so a long shift is one press rather than ten.
 */
const Stepper = ({
  heading,
  value,
  onStep,
  downLabel,
  upLabel,
  canStepDown = true,
  canStepUp = true,
}: StepperProps) => {
  const holdRef = useRef<{ timeout: number | null; interval: number | null }>({
    timeout: null,
    interval: null,
  });
  const release = () => {
    if (holdRef.current.timeout !== null) window.clearTimeout(holdRef.current.timeout);
    if (holdRef.current.interval !== null) window.clearInterval(holdRef.current.interval);
    holdRef.current = { timeout: null, interval: null };
  };
  const press = (direction: -1 | 1) => {
    onStep(direction);
    release();
    holdRef.current.timeout = window.setTimeout(() => {
      holdRef.current.interval = window.setInterval(() => onStep(direction), HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  };
  useEffect(() => release, []);

  const arrowClassName =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-control-border bg-card text-foreground transition-colors duration-200 hover:border-foreground hover:bg-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

  return (
    <div>
      <p className="mb-2 font-mono text-meta uppercase tracking-widest text-muted-foreground">
        {heading}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={downLabel}
          disabled={!canStepDown}
          onPointerDown={(event) => event.button === 0 && press(-1)}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onKeyDown={(event) =>
            (event.key === "Enter" || event.key === " ") && event.preventDefault()
          }
          onKeyUp={(event) => (event.key === "Enter" || event.key === " ") && onStep(-1)}
          className={arrowClassName}
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-[4.5rem] text-center text-base text-foreground" aria-live="polite">
          <Formula tex={value} />
        </span>
        <button
          type="button"
          aria-label={upLabel}
          disabled={!canStepUp}
          onPointerDown={(event) => event.button === 0 && press(1)}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onKeyDown={(event) =>
            (event.key === "Enter" || event.key === " ") && event.preventDefault()
          }
          onKeyUp={(event) => (event.key === "Enter" || event.key === " ") && onStep(1)}
          className={arrowClassName}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
};

const CyclicShiftFigure = ({ labels, className }: CyclicShiftFigureProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animateEntrance || isRevealed;
  const [k, setK] = useState(3);
  /** The group element a, an integer mod N. */
  const [shift, setShift] = useState(0);
  /** The drawn shift, which passes through the reals between integers. */
  const [shiftDrawn, setShiftDrawn] = useState(0);
  const frameRef = useRef<number | null>(null);
  const touredRef = useRef(false);
  const targetRef = useRef(0);
  const drawnRef = useRef(0);

  const animateTo = (from: number, to: number, ms: number, done: () => void) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / ms);
      drawnRef.current = from + (to - from) * easeOut(progress);
      setShiftDrawn(drawnRef.current);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else {
        frameRef.current = null;
        done();
      }
    };
    frameRef.current = requestAnimationFrame(step);
  };

  // One full turn of the group on first sight, once it has assembled, then
  // it waits.
  useEffect(() => {
    if (!isRevealed || touredRef.current || prefersReducedMotion) return;
    touredRef.current = true;
    const timer = window.setTimeout(
      () =>
        animateTo(0, N, TOUR_MS, () => {
          drawnRef.current = 0;
          setShiftDrawn(0);
        }),
      animateEntrance ? ASSEMBLE_MS : 0,
    );
    return () => window.clearTimeout(timer);
    // animateTo reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealed, prefersReducedMotion]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  // The unwrapped target and the value currently drawn live in refs as well
  // as state: a held arrow calls shiftBy from a timer, where the state a
  // render closed over is stale, and each step must build on the last.
  const mod = (value: number) => ((value % N) + N) % N;
  const shiftBy = (amount: number) => {
    targetRef.current += amount;
    const target = targetRef.current;
    setShift(mod(target));
    if (prefersReducedMotion) {
      drawnRef.current = target;
      setShiftDrawn(target);
      return;
    }
    animateTo(drawnRef.current, target, SHIFT_MS, () => {
      // Back into the group once still, so the numbers stay bounded; the
      // drawing is periodic, so nothing moves.
      targetRef.current = mod(target);
      drawnRef.current = targetRef.current;
      setShiftDrawn(targetRef.current);
    });
  };

  const origin = point((2 * Math.PI * shiftDrawn) / N, R);
  const phaseNumerator = (k * shift) % N;

  return (
    <figure ref={ref} aria-label={labels.figure} className={cn("w-full", className)}>
      <div className="grid gap-8 sm:grid-cols-[minmax(0,300px)_1fr] sm:items-stretch">
        <div>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="block h-auto w-full max-w-[300px]"
            aria-hidden="true"
          >
            <circle
              cx={C}
              cy={C}
              r={R}
              fill="none"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              className={cn(
                "stroke-control-border",
                animateEntrance && "transition-[stroke-dashoffset] duration-700 ease-brand",
                drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
              )}
            />
            <path
              d={modePath(k, shiftDrawn)}
              fill="none"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              style={animateEntrance ? { transitionDelay: "400ms" } : undefined}
              className={cn(
                "stroke-iris",
                animateEntrance && "transition-[stroke-dashoffset] duration-700 ease-brand",
                drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
              )}
            />
            <g className="fill-control-border">
              {ELEMENTS.map(({ x, y }, index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={1.6}
                  style={
                    animateEntrance
                      ? { transitionDelay: `${index * ELEMENT_STAGGER_MS}ms` }
                      : undefined
                  }
                  className={cn(
                    animateEntrance && "transition-opacity duration-200",
                    drawn ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </g>
            {/* The element a: where the shift has carried the identity. */}
            <rect
              x={origin.x - 4}
              y={origin.y - 4}
              width={8}
              height={8}
              rx={1.5}
              className="fill-primary"
            />
            <text
              x={C}
              y={C + 4}
              textAnchor="middle"
              fontSize={12}
              className="fill-muted-foreground font-mono"
            >
              ℤ₁₁₃
            </text>
          </svg>
        </div>

        {/* The controls at the top of the column and the readout at its foot,
            level with the base of the drawing, so nothing hangs below either. */}
        <div className="flex flex-col gap-8 sm:min-h-full sm:justify-between">
          <div className="space-y-6">
            <Stepper
              heading={labels.mode}
              value={`k = ${k}`}
              onStep={(direction) =>
                setK((value) => Math.min(K_MAX, Math.max(K_MIN, value + direction)))
              }
              downLabel={labels.modeDown}
              upLabel={labels.modeUp}
              canStepDown={k > K_MIN}
              canStepUp={k < K_MAX}
            />
            <Stepper
              heading={labels.shiftGroup}
              value={`a = ${shift}`}
              onStep={(direction) => shiftBy(direction)}
              downLabel={labels.shiftDown}
              upLabel={labels.shiftUp}
            />
          </div>
          <div className="space-y-2 text-base text-foreground" aria-live="polite">
            <p>
              <Formula
                tex={`φ = \\frac{2π · ${k} · ${shift}}{113} = \\frac{2π · ${phaseNumerator}}{113}`}
              />
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-6 text-sm text-muted-foreground">
        <MathText text={labels.caption} />
      </figcaption>
    </figure>
  );
};

export default CyclicShiftFigure;
