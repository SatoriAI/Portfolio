import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

/**
 * The domain a paper works on, drawn: a cone, or a double cone. Hairlines in
 * the motif's weight, with the base ellipse dashed where it passes behind.
 * Each glyph draws itself once as it enters the viewport, and is inert under
 * reduced motion. With `entrance="mount"` it draws as soon as it is mounted
 * instead, whether or not it was already on screen — the publication stack
 * remounts the open sheet's glyph on every selection, so a paper draws its
 * domain each time it is pulled to the front.
 *
 * These are the multidimensional domains the two papers estimate Jacobi heat
 * kernels on, shown in the three dimensions a page can hold.
 */

export type DomainKind = "cone" | "double-cone";

const STROKES: Record<DomainKind, { front: string[]; back: string[] }> = {
  cone: {
    front: ["M40 12 L8 72", "M40 12 L72 72", "M8 72 A32 10 0 0 0 72 72"],
    back: ["M8 72 A32 10 0 0 1 72 72"],
  },
  "double-cone": {
    front: [
      "M40 44 L8 8",
      "M40 44 L72 8",
      "M40 44 L8 80",
      "M40 44 L72 80",
      "M8 8 A32 8 0 0 0 72 8",
      "M8 80 A32 8 0 0 0 72 80",
    ],
    back: ["M8 8 A32 8 0 0 1 72 8", "M8 80 A32 8 0 0 1 72 80"],
  },
};

type DomainGlyphProps = {
  kind: DomainKind;
  /** When the drawing runs: as the glyph scrolls into view, or as soon as it mounts. */
  entrance?: "reveal" | "mount";
  className?: string;
};

const DomainGlyph = ({ kind, entrance = "reveal", className }: DomainGlyphProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLSpanElement>();
  const { front, back } = STROKES[kind];

  // A reveal entrance is a transition released by the intersection observer.
  // A mount entrance is a CSS animation, which needs no script timing: it
  // plays the moment the glyph is painted, in a background tab as well.
  const onMount = entrance === "mount" && !prefersReducedMotion;
  const onReveal = entrance === "reveal" && !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !onReveal || isRevealed;

  const strokeProps = (delayMs: number) => ({
    className: cn(
      onMount && "animate-draw motion-reduce:animate-none",
      onReveal && "transition-[stroke-dashoffset] duration-500 ease-brand",
      drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
    ),
    style:
      onMount || onReveal
        ? { animationDelay: `${delayMs}ms`, transitionDelay: `${delayMs}ms` }
        : undefined,
  });
  const apexDelayMs = (back.length + front.length) * 120;

  return (
    <span ref={ref} className={cn("block", className)}>
      <svg viewBox="0 0 80 88" className="block h-full w-auto" aria-hidden="true">
        <g fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke">
          {back.map((d, index) => (
            <path
              key={`back-${index}`}
              d={d}
              pathLength={1}
              strokeDasharray="1"
              vectorEffect="non-scaling-stroke"
              {...strokeProps(index * 120)}
              className={cn("stroke-iris/50", strokeProps(index * 120).className)}
            />
          ))}
          {front.map((d, index) => (
            <path
              key={`front-${index}`}
              d={d}
              pathLength={1}
              strokeDasharray="1"
              vectorEffect="non-scaling-stroke"
              {...strokeProps((back.length + index) * 120)}
              className={cn("stroke-iris", strokeProps((back.length + index) * 120).className)}
            />
          ))}
        </g>
        {/* The apex: the point the papers' estimates are sharpest about. */}
        <circle
          cx={40}
          cy={kind === "cone" ? 12 : 44}
          r={3}
          style={
            onMount || onReveal
              ? { animationDelay: `${apexDelayMs}ms`, transitionDelay: `${apexDelayMs}ms` }
              : undefined
          }
          className={cn(
            "fill-primary",
            onMount &&
              "duration-400 animate-in fade-in-0 fill-mode-both motion-reduce:animate-none",
            onReveal && "transition-opacity duration-400 ease-brand",
            drawn ? "opacity-100" : "opacity-0",
          )}
        />
      </svg>
    </span>
  );
};

/**
 * Which domain a paper's title names. The two papers are on conic and double
 * conic domains; a title naming neither gets no glyph rather than a wrong one.
 */
export const domainFor = (title: string): DomainKind | null => {
  if (/double|podwójn/i.test(title)) return "double-cone";
  if (/conic|cone|stożk/i.test(title)) return "cone";
  return null;
};

export default DomainGlyph;
