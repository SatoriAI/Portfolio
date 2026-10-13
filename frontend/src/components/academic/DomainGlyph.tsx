import { useLayoutEffect, useRef, useState } from "react";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { GLYPH_SCALE } from "@/lib/domainGlyph";
import { cn } from "@/lib/utils";

/**
 * The domain a piece of work is set on, drawn: a cone or a double cone for
 * the papers; a torus above an interval, a cone, and a solid of revolution
 * for the three degrees. Hairlines in the motif's weight, with the strokes
 * that pass behind drawn fainter.
 * Each glyph draws itself once as it enters the viewport, and is inert under
 * reduced motion. With `entrance="mount"` it draws as soon as it is mounted
 * instead, whether or not it was already on screen — the publication stack
 * remounts the open sheet's glyph on every selection, so a paper draws its
 * domain each time it is pulled to the front.
 *
 * These are the multidimensional domains the work estimates heat kernels on,
 * shown in the three dimensions a page can hold. `delayMs` holds a glyph
 * back, so several side by side can draw one after another.
 */

/** The drawing's height in its own units; strokes are sized against it. */
const VIEW_HEIGHT = 88;

// Registered as a number, so a parent can animate the scale it draws a
// glyph at along with its transform (see GLYPH_SCALE).
if (typeof CSS !== "undefined" && typeof CSS.registerProperty === "function") {
  try {
    CSS.registerProperty({
      name: GLYPH_SCALE,
      syntax: "<number>",
      inherits: true,
      initialValue: "1",
    });
  } catch {
    // Already registered: a hot reload ran this module again.
  }
}

export type DomainKind = "cone" | "double-cone" | "torus-interval" | "revolution";

/** `point`: a dot drawn last, where the papers' estimates are sharpest. */
const STROKES: Record<DomainKind, { front: string[]; back: string[]; point?: [number, number] }> = {
  cone: {
    front: ["M40 12 L8 72", "M40 12 L72 72", "M8 72 A32 10 0 0 0 72 72"],
    back: ["M8 72 A32 10 0 0 1 72 72"],
    point: [40, 12],
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
    point: [40, 44],
  },
  // The bachelor's thesis: the heat equation on the torus and on the interval.
  // A ring with its hole above; below, the interval with its two endpoints.
  "torus-interval": {
    front: [
      "M8 30 A32 15 0 1 0 72 30 A32 15 0 1 0 8 30",
      "M25 28 Q40 38 55 28",
      "M29 31 Q40 25 51 31",
      "M8 74 L72 74",
      "M8 69 L8 79",
      "M72 69 L72 79",
    ],
    back: [],
  },
  // The doctorate: spaces with rotational symmetry. A curved profile turned
  // about its axis, the axis and the far side of the base fainter.
  revolution: {
    front: [
      "M28 12 A12 4 0 1 0 52 12 A12 4 0 1 0 28 12",
      "M28 12 C10 30 6 56 12 76",
      "M52 12 C70 30 74 56 68 76",
      "M12 76 A28 8 0 0 0 68 76",
    ],
    back: ["M40 4 L40 84", "M12 76 A28 8 0 0 1 68 76"],
  },
};

type DomainGlyphProps = {
  kind: DomainKind;
  /** Held back by this long before the first stroke draws. */
  delayMs?: number;
  /** When the drawing runs: as the glyph scrolls into view, or as soon as it mounts. */
  entrance?: "reveal" | "mount";
  className?: string;
};

const DomainGlyph = ({ kind, delayMs = 0, entrance = "reveal", className }: DomainGlyphProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLSpanElement>();
  const { front, back, point } = STROKES[kind];

  // A hairline at any size. The strokes are drawn in by animating a dash
  // measured along each path (pathLength 1), and a non-scaling stroke would
  // set that dash in screen pixels instead, leaving each stroke only partly
  // drawn once the glyph is scaled up. So the stroke scales with the glyph,
  // and its width is set from the glyph's rendered height to come out at 1px.
  // A parent that scales the glyph with a transform names the factor in
  // --glyph-scale (see GLYPH_SCALE): the width is then set for the unscaled
  // glyph and divided by the factor as it changes, so the line stays a
  // hairline at every step of the scaling, measured at whatever step it is.
  const svg = useRef<SVGSVGElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(1);
  useLayoutEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      const scale = parseFloat(getComputedStyle(element).getPropertyValue(GLYPH_SCALE)) || 1;
      if (height > 0) setStrokeWidth((VIEW_HEIGHT / height) * scale);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A reveal entrance is a transition released by the intersection observer.
  // A mount entrance is a CSS animation, which needs no script timing: it
  // plays the moment the glyph is painted, in a background tab as well.
  const onMount = entrance === "mount" && !prefersReducedMotion;
  const onReveal = entrance === "reveal" && !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !onReveal || isRevealed;

  const strokeProps = (strokeDelayMs: number) => ({
    className: cn(
      onMount && "animate-draw motion-reduce:animate-none",
      onReveal && "transition-[stroke-dashoffset] duration-500 ease-brand",
      drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
    ),
    style:
      onMount || onReveal
        ? {
            animationDelay: `${delayMs + strokeDelayMs}ms`,
            transitionDelay: `${delayMs + strokeDelayMs}ms`,
          }
        : undefined,
  });
  const apexDelayMs = delayMs + (back.length + front.length) * 120;

  return (
    <span ref={ref} className={cn("block", className)}>
      <svg
        ref={svg}
        viewBox={`0 0 80 ${VIEW_HEIGHT}`}
        className="block h-full w-auto"
        aria-hidden="true"
      >
        <g fill="none" style={{ strokeWidth: `calc(${strokeWidth}px / var(${GLYPH_SCALE}, 1))` }}>
          {back.map((d, index) => (
            <path
              key={`back-${index}`}
              d={d}
              pathLength={1}
              strokeDasharray="1"
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
              {...strokeProps((back.length + index) * 120)}
              className={cn("stroke-iris", strokeProps((back.length + index) * 120).className)}
            />
          ))}
        </g>
        {/* The apex: the point the papers' estimates are sharpest about. */}
        {point && (
          <circle
            cx={point[0]}
            cy={point[1]}
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
        )}
      </svg>
    </span>
  );
};

export default DomainGlyph;
