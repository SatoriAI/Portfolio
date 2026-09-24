import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

/**
 * The domain a paper works on, drawn: a cone, or a double cone. Hairlines in
 * the motif's weight, with the base ellipse dashed where it passes behind.
 * Each glyph draws itself once as it enters the viewport, and is inert under
 * reduced motion.
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
  className?: string;
};

const DomainGlyph = ({ kind, className }: DomainGlyphProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLSpanElement>();
  const animate = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animate || isRevealed;
  const { front, back } = STROKES[kind];

  const lineClassName = (delayMs: number) =>
    cn(
      animate && "transition-[stroke-dashoffset] duration-700 ease-brand",
      drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
    );

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
              className={cn("stroke-iris/50", lineClassName(index * 120))}
              style={animate ? { transitionDelay: `${index * 120}ms` } : undefined}
              strokeDashoffset={drawn ? 0 : 1}
            />
          ))}
          {front.map((d, index) => (
            <path
              key={`front-${index}`}
              d={d}
              pathLength={1}
              strokeDasharray="1"
              vectorEffect="non-scaling-stroke"
              className={cn("stroke-iris", lineClassName(index * 120))}
              style={animate ? { transitionDelay: `${index * 120}ms` } : undefined}
            />
          ))}
        </g>
        {/* The apex: the point the papers' estimates are sharpest about. */}
        <circle
          cx={40}
          cy={kind === "cone" ? 12 : 44}
          r={3}
          className={cn(
            "fill-primary transition-opacity duration-400 ease-brand",
            drawn ? "opacity-100" : "opacity-0",
          )}
          style={animate ? { transitionDelay: "700ms" } : undefined}
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
