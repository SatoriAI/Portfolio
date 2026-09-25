import { useEffect, useRef, useState } from "react";

import { Formula, MathText } from "@/components/Formula";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  applyGate,
  blochVector,
  formatComplex,
  type GateName,
  GATES,
  probabilities,
  type Qubit,
  rotate,
  ZERO,
} from "@/lib/qubit";
import { cn } from "@/lib/utils";

/**
 * A single qubit a visitor can operate.
 *
 * The state is an actual pair of amplitudes and each button applies an actual
 * unitary; nothing here is a picture of quantum computing, it is a very small
 * quantum computer. The Bloch sphere shows the state as a vector, and a gate
 * turns it along the rotation the gate really performs — H is a half turn
 * about the axis between x and z, T an eighth of a turn about z — over the
 * kit's 400ms. The amplitudes, the probabilities and the circuit applied so
 * far are printed beside it, so the drawing never carries the information
 * alone. Two H gates in a row take the state back to |0⟩: interference, found
 * by pressing a button twice.
 *
 * The sphere is drawn in the kit's motif vocabulary — 1px lines, the state's
 * tip as the single navy dot — in a slightly tilted orthographic projection so
 * the y axis reads as depth. On first sight it draws itself: the outline,
 * the equator, the axes, then the vector rising to |0⟩.
 */

const GATE_ORDER: GateName[] = ["H", "X", "Z", "S", "T"];
const CIRCUIT_LENGTH = 8;
const TURN_MS = 400;

const R = 100;
const CX = 130;
const CY = 120;
/** How much of the y axis shows: the sphere is tilted this fraction towards the viewer. */
const TILT = 0.32;

const project = ([x, y, z]: [number, number, number]) => ({
  x: CX + x * R,
  y: CY - z * R + y * TILT * R,
});

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export type QubitFigureLabels = {
  /** Accessible name of the figure. */
  figure: string;
  caption: string;
  /** Heading of the gate buttons. */
  gates: string;
  reset: string;
  circuit: string;
  state: string;
};

type QubitFigureProps = {
  labels: QubitFigureLabels;
  className?: string;
};

const QubitFigure = ({ labels, className }: QubitFigureProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, isRevealed, isInitiallyVisible } = useScrollReveal<HTMLElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const built = !animateEntrance || isRevealed;
  const drawClassName = (delayMs: number) => ({
    className: cn(
      animateEntrance && "transition-[stroke-dashoffset] duration-500 ease-brand",
      built ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
    ),
    style: animateEntrance ? { transitionDelay: `${delayMs}ms` } : undefined,
    pathLength: 1,
    strokeDasharray: 1,
  });
  const [state, setState] = useState<Qubit>(ZERO);
  const [circuit, setCircuit] = useState<GateName[]>([]);
  // The drawn vector lags the state while a gate turns it.
  const [drawn, setDrawn] = useState<[number, number, number]>(blochVector(ZERO));
  const frameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const settle = (next: Qubit) => setDrawn(blochVector(next));

  const apply = (name: GateName) => {
    const gate = GATES[name];
    const from = blochVector(state);
    const next = applyGate(state, gate);
    setState(next);
    setCircuit((previous) => [...previous, name].slice(-CIRCUIT_LENGTH));

    if (prefersReducedMotion) {
      settle(next);
      return;
    }
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / TURN_MS);
      setDrawn(rotate(from, gate.axis, gate.angle * easeOut(progress)));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else {
        frameRef.current = null;
        settle(next);
      }
    };
    frameRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setState(ZERO);
    setCircuit([]);
    settle(ZERO);
  };

  const tip = project(drawn);
  const shadow = project([drawn[0], drawn[1], 0]);
  const [p0, p1] = probabilities(state);
  const behind = drawn[1] < 0;

  return (
    <figure ref={ref} aria-label={labels.figure} className={cn("w-full", className)}>
      <div className="grid gap-8 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-stretch">
        <div>
          <svg
            viewBox="0 0 260 240"
            className="block h-auto w-full max-w-[260px]"
            aria-hidden="true"
          >
            <g fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke">
              <circle
                cx={CX}
                cy={CY}
                r={R}
                {...drawClassName(0)}
                className={cn("stroke-control-border", drawClassName(0).className)}
              />
              {/* The equator's dash pattern is drawn by opacity rather than by
                offset, since a dash offset would fight its own dashes. */}
              <ellipse
                cx={CX}
                cy={CY}
                rx={R}
                ry={R * TILT}
                strokeDasharray="3 4"
                style={animateEntrance ? { transitionDelay: "500ms" } : undefined}
                className={cn(
                  "stroke-control-border",
                  animateEntrance && "transition-opacity duration-400 ease-brand",
                  built ? "opacity-100" : "opacity-0",
                )}
              />
              <line
                x1={CX}
                y1={CY - R}
                x2={CX}
                y2={CY + R}
                {...drawClassName(300)}
                className={cn("stroke-control-border", drawClassName(300).className)}
              />
              <line
                x1={CX - R}
                y1={CY}
                x2={CX + R}
                y2={CY}
                {...drawClassName(450)}
                className={cn("stroke-control-border", drawClassName(450).className)}
              />
            </g>
            <g className="fill-muted-foreground font-mono" fontSize={10}>
              <text x={CX} y={CY - R - 6} textAnchor="middle">
                |0⟩
              </text>
              <text x={CX} y={CY + R + 14} textAnchor="middle">
                |1⟩
              </text>
              <text x={CX + R + 4} y={CY + 3} textAnchor="start">
                |+⟩
              </text>
              <text x={CX - R - 4} y={CY + 3} textAnchor="end">
                |−⟩
              </text>
            </g>
            {/* The vector, its drop to the equatorial plane, and the tip. */}
            <g fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke">
              <line
                x1={shadow.x}
                y1={shadow.y}
                x2={tip.x}
                y2={tip.y}
                className="stroke-iris"
                strokeDasharray="2 3"
              />
              <line
                x1={CX}
                y1={CY}
                x2={tip.x}
                y2={tip.y}
                strokeWidth={2}
                {...drawClassName(600)}
                className={cn("stroke-iris", behind && "opacity-60", drawClassName(800).className)}
              />
            </g>
            <circle
              cx={tip.x}
              cy={tip.y}
              r={5}
              style={animateEntrance ? { transitionDelay: "1000ms" } : undefined}
              className={cn(
                "fill-primary",
                behind && "opacity-70",
                animateEntrance && "transition-opacity duration-400 ease-brand",
                !built && "opacity-0",
              )}
            />
          </svg>
        </div>

        {/* Gates at the top of the column, the state at its foot, level with
            the base of the sphere. */}
        <div className="flex flex-col gap-8 sm:min-h-full sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-meta uppercase tracking-widest text-muted-foreground">
              {labels.gates}
            </p>
            {/* Five gates on one row: 40px each with 6px between fits the column
              beside a 300px sphere. */}
            <div className="flex flex-wrap gap-1.5">
              {GATE_ORDER.map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  className="h-10 w-10 px-0 font-mono"
                  onClick={() => apply(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={reset}
              disabled={circuit.length === 0}
            >
              {labels.reset}
            </Button>
          </div>
          <dl className="space-y-2 text-base">
            <div>
              <dt className="font-mono text-meta uppercase tracking-widest text-muted-foreground">
                {labels.circuit}
              </dt>
              <dd className="mt-1 text-foreground" aria-live="polite">
                <Formula tex={`|0⟩${circuit.map((name) => ` → ${name}`).join("")}`} />
              </dd>
            </div>
            <div>
              <dt className="font-mono text-meta uppercase tracking-widest text-muted-foreground">
                {labels.state}
              </dt>
              <dd className="mt-1 text-foreground">
                <Formula
                  tex={`(${formatComplex(state.alpha)}) |0⟩ + (${formatComplex(state.beta)}) |1⟩`}
                />
              </dd>
              <dd className="mt-1 text-muted-foreground">
                <Formula tex={`P(0) = ${p0.toFixed(2)} · P(1) = ${p1.toFixed(2)}`} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <figcaption className="mt-6 text-sm text-muted-foreground">
        <MathText text={labels.caption} />
      </figcaption>
    </figure>
  );
};

export default QubitFigure;
