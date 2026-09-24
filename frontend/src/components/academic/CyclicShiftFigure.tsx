import { useEffect, useRef, useState } from "react";

import { Formula, MathText } from "@/components/Formula";
import { Button } from "@/components/ui/button";
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
const MODES = [1, 3, 8] as const;
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
  /** The shift control, e.g. "shift by 1". */
  shift: string;
  /** Heading of the mode buttons. */
  mode: string;
};

type CyclicShiftFigureProps = {
  labels: CyclicShiftFigureLabels;
  className?: string;
};

const CyclicShiftFigure = ({ labels, className }: CyclicShiftFigureProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animateEntrance || isRevealed;
  const [k, setK] = useState<(typeof MODES)[number]>(3);
  /** The group element a, an integer mod N. */
  const [shift, setShift] = useState(0);
  /** The drawn shift, which passes through the reals between integers. */
  const [shiftDrawn, setShiftDrawn] = useState(0);
  const frameRef = useRef<number | null>(null);
  const touredRef = useRef(false);

  const animateTo = (from: number, to: number, ms: number, done: () => void) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / ms);
      setShiftDrawn(from + (to - from) * easeOut(progress));
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
      () => animateTo(0, N, TOUR_MS, () => setShiftDrawn(0)),
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

  const shiftBy = (amount: number) => {
    const next = (shift + amount) % N;
    setShift(next);
    if (prefersReducedMotion) {
      setShiftDrawn(next);
      return;
    }
    animateTo(shiftDrawn, shift + amount, SHIFT_MS, () => setShiftDrawn(next));
  };

  const origin = point((2 * Math.PI * shiftDrawn) / N, R);
  const phaseNumerator = (k * shift) % N;

  return (
    <figure ref={ref} aria-label={labels.figure} className={cn("w-full", className)}>
      <div className="grid gap-6 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-start">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block h-auto w-full max-w-[260px]"
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

        <div className="space-y-5">
          <div>
            <p className="mb-2 font-mono text-meta uppercase tracking-widest text-muted-foreground">
              {labels.mode}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={labels.mode}>
              {MODES.map((mode) => (
                <Button
                  key={mode}
                  variant="outline"
                  size="sm"
                  aria-pressed={mode === k}
                  className={cn("w-14 font-mono", mode === k && "border-foreground bg-lavender")}
                  onClick={() => setK(mode)}
                >
                  k = {mode}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="font-mono" onClick={() => shiftBy(1)}>
              {labels.shift} 1
            </Button>
            <Button variant="outline" size="sm" className="font-mono" onClick={() => shiftBy(10)}>
              {labels.shift} 10
            </Button>
          </div>
          <div className="space-y-2 text-base text-foreground" aria-live="polite">
            <p>
              <Formula tex={`a = ${shift}`} />
            </p>
            <p>
              <Formula
                tex={`φ = \\frac{2π · ${k} · ${shift}}{113} = \\frac{2π · ${phaseNumerator}}{113}`}
              />
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 max-w-[48ch] text-sm text-muted-foreground">
        <MathText text={labels.caption} />
      </figcaption>
    </figure>
  );
};

export default CyclicShiftFigure;
