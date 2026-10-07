import { type PointerEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { useLatest } from "@/hooks/use-latest";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { heatPulseKeyframes } from "@/lib/heatPulse";
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
 *
 * With `heat`, the drawing shows what the work is about. Once drawn, a point
 * of heat is set on the shape and spreads over its surface as the heat
 * kernel does, then fades to rest; pressing the shape anywhere sets another
 * there. Each spread settles and stops, so nothing plays on its own after
 * the first. None of it under reduced motion.
 */

/** The drawing's height in its own units; strokes are sized against it. */
const VIEW_HEIGHT = 88;

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

/**
 * Each degree's shape as a surface heat can spread over: the outline filled,
 * a hole cut by the even-odd rule. `start` is where the first heat is set:
 * the cone's apex, where the papers' estimates are sharpest; the middle of
 * the others.
 */
const SURFACES: Partial<Record<DomainKind, { d: string; start: [number, number] }>> = {
  cone: { d: "M40 12 L8 72 A32 10 0 0 0 72 72 Z", start: [40, 12] },
  "torus-interval": {
    d: "M8 30 A32 15 0 1 0 72 30 A32 15 0 1 0 8 30 Z M28 30 A12 3.5 0 1 0 52 30 A12 3.5 0 1 0 28 30 Z M8 71 H72 V77 H8 Z",
    start: [40, 40],
  },
  revolution: {
    d: "M28 12 C10 30 6 56 12 76 A28 8 0 0 0 68 76 C74 56 70 30 52 12 A12 4 0 0 0 28 12 Z",
    start: [40, 40],
  },
};

/** How wide a spread ends, in the drawing's units, how long it takes, and its first glow. */
const HEAT_RADIUS = 56;
const HEAT_MS = 2400;
const HEAT_PEAK = 1;
/** More sources than this at once and the first gives way. */
const HEAT_SOURCES = 4;

/** One point of heat: placed, spread, gone. */
const HeatSource = ({
  x,
  y,
  fill,
  onDone,
}: {
  x: number;
  y: number;
  fill: string;
  onDone: () => void;
}) => {
  const circle = useRef<SVGCircleElement>(null);
  const done = useLatest(onDone);
  useLayoutEffect(() => {
    const spread = circle.current?.animate(heatPulseKeyframes(HEAT_PEAK), {
      duration: HEAT_MS,
      fill: "both",
    });
    if (spread) spread.onfinish = () => done.current();
    return () => spread?.cancel();
  }, [done]);
  return (
    <circle
      ref={circle}
      cx={x}
      cy={y}
      r={HEAT_RADIUS}
      fill={fill}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
};

type DomainGlyphProps = {
  kind: DomainKind;
  /** Heat spreads over the drawn shape, once and wherever it is pressed. */
  heat?: boolean;
  /** Held back by this long before the first stroke draws. */
  delayMs?: number;
  /** When the drawing runs: as the glyph scrolls into view, or as soon as it mounts. */
  entrance?: "reveal" | "mount";
  className?: string;
};

const DomainGlyph = ({
  kind,
  heat = false,
  delayMs = 0,
  entrance = "reveal",
  className,
}: DomainGlyphProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLSpanElement>();
  const { front, back, point } = STROKES[kind];

  // A hairline at any size. The strokes are drawn in by animating a dash
  // measured along each path (pathLength 1), and a non-scaling stroke would
  // set that dash in screen pixels instead, leaving each stroke only partly
  // drawn once the glyph is scaled up. So the stroke scales with the glyph,
  // and its width is set from the glyph's rendered height to come out at 1px.
  const svg = useRef<SVGSVGElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(1);
  useLayoutEffect(() => {
    const element = svg.current;
    if (!element) return;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      if (height > 0) setStrokeWidth(VIEW_HEIGHT / height);
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

  const surface = heat && !prefersReducedMotion ? SURFACES[kind] : undefined;
  const ids = useId();
  const surfacePath = useRef<SVGPathElement>(null);
  const [sources, setSources] = useState<{ key: number; x: number; y: number }[]>([]);
  const nextKey = useRef(0);
  const addSource = (x: number, y: number) =>
    setSources((now) => [...now.slice(1 - HEAT_SOURCES), { key: nextKey.current++, x, y }]);

  // The first heat, once the last stroke is drawn.
  const start = surface?.start;
  useEffect(() => {
    if (!start) return;
    const timer = window.setTimeout(() => addSource(...start), apexDelayMs + 500);
    return () => window.clearTimeout(timer);
  }, [start, apexDelayMs]);

  // A press on the shape sets heat where it landed; off the shape, nothing.
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = svg.current?.getScreenCTM()?.inverse();
    if (!surface || !matrix || !surfacePath.current) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    if (surfacePath.current.isPointInFill(point)) addSource(point.x, point.y);
  };

  return (
    <span ref={ref} className={cn("block", className)}>
      <svg
        ref={svg}
        viewBox={`0 0 80 ${VIEW_HEIGHT}`}
        className={cn("block h-full w-auto", surface && "cursor-pointer")}
        aria-hidden="true"
        onPointerDown={surface ? onPointerDown : undefined}
      >
        {/* The heat, under the strokes and inside the shape: iris where it is
            hottest, the kit's blush around it, its lavender at the edge. */}
        {surface && (
          <>
            <defs>
              <radialGradient id={`${ids}-heat`}>
                <stop offset="0" style={{ stopColor: "hsl(var(--iris))", stopOpacity: 0.55 }} />
                <stop
                  offset="0.2"
                  style={{ stopColor: "hsl(var(--blush-deep))", stopOpacity: 1 }}
                />
                <stop
                  offset="0.55"
                  style={{ stopColor: "hsl(var(--lavender-deep))", stopOpacity: 0.6 }}
                />
                <stop
                  offset="1"
                  style={{ stopColor: "hsl(var(--lavender-deep))", stopOpacity: 0 }}
                />
              </radialGradient>
              <clipPath id={`${ids}-surface`}>
                <path d={surface.d} clipRule="evenodd" />
              </clipPath>
            </defs>
            <path ref={surfacePath} d={surface.d} fillRule="evenodd" fill="transparent" />
            <g clipPath={`url(#${ids}-surface)`}>
              {sources.map((source) => (
                <HeatSource
                  key={source.key}
                  x={source.x}
                  y={source.y}
                  fill={`url(#${ids}-heat)`}
                  onDone={() => setSources((now) => now.filter((one) => one.key !== source.key))}
                />
              ))}
            </g>
          </>
        )}
        <g fill="none" strokeWidth={strokeWidth}>
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
