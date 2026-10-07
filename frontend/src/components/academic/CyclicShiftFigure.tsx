import FigureFrame from "@/components/academic/FigureFrame";
import { MathText } from "@/components/Formula";
import { RangeInput } from "@/components/ui/range-input";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { modePath, ringPoint } from "@/lib/cyclicShift";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * The numbers 0 to 112 on a circle, and a wave drawn over them. The visitor
 * adds the same amount to every number; the wave moves with the numbers and
 * keeps its shape. A faint copy stays where the wave started, so the shape
 * can be compared, and the number 0, a labelled square on the ring, rides
 * round with the rest to show how far everything moved.
 *
 * This is an illustration of a mathematical principle, and says so: the wave
 * is the Fourier mode k of the cyclic group ℤ₁₁₃, with k = 3 chosen as an
 * example, not read from the trained models. Adding a is the group acting on
 * itself, and a shift of the argument is only a change of phase,
 *
 *   e^(2πik(x+a)/113) = e^(2πika/113) · e^(2πikx/113),
 *
 * which is why the shape cannot change.
 *
 * The panel holds the drawing only, so it can be the section's focus. Its two
 * controls, the number of waves and the amount added, are
 * {@link CyclicShiftControls}, which the page sets beside it; the page owns k
 * and a and hands them to both.
 *
 * The shift is drawn directly, one step of the group at a time, with no
 * tween: the group is discrete. On first sight the figure draws itself —
 * ring, numbers, wave — and then waits for the visitor; under reduced motion
 * it stands complete.
 */

const N = 113;
// Just room for the wave at its highest, R + A, and its stroke: the 0 rides
// on the ring itself, so nothing needs space outside the wave.
const SIZE = 276;
const C = SIZE / 2;
const RING = { center: C, radius: 112, amplitude: 22 };
/** Modes k and 113 − k draw the same curve mirrored, so k runs to 56. */
const K_MIN = 1;
const K_MAX = 56;
/** The mode drawn until the visitor picks another: an example, not a finding. */
export const K_DEFAULT = 3;
const ELEMENT_STAGGER_MS = 4;

const ELEMENTS = Array.from({ length: N }, (_, x) => ringPoint(C, RING.radius, x, N));
const MARKER = 16;

type CyclicShiftFigureProps = {
  labels: {
    /** "Illustration of a mathematical principle". */
    label: string;
    /** Accessible name of the figure. */
    figure: string;
    /** The caption under the drawing, inside the panel. */
    note: string;
  };
  /** The mode drawn: how many waves go round the circle. */
  k: number;
  /** The amount added to every number, an element of ℤ₁₁₃. */
  add: number;
  /** Id of text elsewhere on the page that says what to look for. */
  describedBy?: string;
};

const CyclicShiftFigure = ({ labels, k, add, describedBy }: CyclicShiftFigureProps) => {
  const { ref, isInitiallyVisible, isRevealed, prefersReducedMotion } =
    useScrollReveal<HTMLElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animateEntrance || isRevealed;

  // The number 0, carried a places round with every other number.
  const zero = ringPoint(C, RING.radius, add, N);
  const drawTransition =
    animateEntrance && "transition-[stroke-dashoffset] duration-700 ease-brand";

  return (
    <FigureFrame kind="illustration" label={labels.label}>
      <figure ref={ref} aria-label={labels.figure} aria-describedby={describedBy}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto my-4 block h-auto w-full max-w-[400px]"
          aria-hidden="true"
        >
          {/* The ring and the wave draw themselves with pathLength={1} and a
              dash of 1. No non-scaling-stroke on them: with it the dash is
              measured on screen and the length in the drawing, and once the
              drawing is shown larger than its viewBox the dash falls short
              and leaves a gap. */}
          <circle
            cx={C}
            cy={C}
            r={RING.radius}
            fill="none"
            strokeWidth={1}
            pathLength={1}
            strokeDasharray={1}
            className={cn(
              "stroke-lavender-deep",
              drawTransition,
              drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
            )}
          />
          {/* Where the wave started, faint, to compare its shape against; solid
            so it is not mistaken for the dotted circle of numbers. */}
          <path
            d={modePath(RING, N, k, 0)}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className={cn(
              "stroke-iris/40",
              animateEntrance && "transition-opacity delay-700 duration-200",
              drawn ? "opacity-100" : "opacity-0",
            )}
          />
          <path
            d={modePath(RING, N, k, add)}
            fill="none"
            strokeWidth={2}
            pathLength={1}
            strokeDasharray={1}
            style={animateEntrance ? { transitionDelay: "400ms" } : undefined}
            className={cn(
              "stroke-iris",
              drawTransition,
              drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
            )}
          />
          <g className="fill-muted-foreground">
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
          <rect
            x={zero.x - MARKER / 2}
            y={zero.y - MARKER / 2}
            width={MARKER}
            height={MARKER}
            rx={3}
            className="fill-primary"
          />
          <text
            x={zero.x}
            y={zero.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            className="fill-primary-foreground font-mono"
          >
            0
          </text>
        </svg>
        <figcaption className="mt-6 text-sm text-foreground/80">{labels.note}</figcaption>
      </figure>
    </FigureFrame>
  );
};

export type CyclicShiftControlsLabels = {
  /** The k slider's label, with `{k}`; may carry a `$…$` formula. */
  waves: string;
  /** The shift slider's label, with `{a}`; may carry a `$…$` formula. */
  add: string;
};

type CyclicShiftControlsProps = {
  labels: CyclicShiftControlsLabels;
  k: number;
  add: number;
  onKChange: (k: number) => void;
  onAddChange: (add: number) => void;
};

/**
 * The figure's two sliders, one label style for both: the number of waves and
 * the amount added to every number. What the visitor sees in the drawing is
 * the answer, so nothing is said in words.
 */
export const CyclicShiftControls = ({
  labels,
  k,
  add,
  onKChange,
  onAddChange,
}: CyclicShiftControlsProps) => (
  <div>
    <label className="block">
      <span className="text-sm text-foreground">
        <MathText text={fillTemplate(labels.waves, { k })} />
      </span>
      <RangeInput
        min={K_MIN}
        max={K_MAX}
        step={1}
        value={k}
        valueText={`k = ${k}`}
        onChange={(event) => onKChange(Number(event.target.value))}
      />
    </label>
    <label className="mt-3 block">
      <span className="text-sm text-foreground">
        <MathText text={fillTemplate(labels.add, { a: add })} />
      </span>
      <RangeInput
        min={0}
        max={N - 1}
        step={1}
        value={add}
        valueText={`+${add}`}
        onChange={(event) => onAddChange(Number(event.target.value))}
      />
    </label>
  </div>
);

export default CyclicShiftFigure;
