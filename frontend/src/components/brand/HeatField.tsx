import {
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  useEffect,
  useRef,
} from "react";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { easeOutCubic } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The kit's diffusion motif, computed rather than drawn.
 *
 * The motif looks like heat spreading because that is what it is here: each
 * colour field is the heat kernel of the plane, u(x, t) = Q / 4πt · e^(−|x|²/4t),
 * the solution of ∂ₜu = Δu for a point source. Two sources — one lavender, one
 * blush — are placed where the kit places its ellipses, and the field a visitor
 * sees is the sum of their kernels at time t. On a live field t runs from
 * nearly zero to one once after mount, so the page opens on two points of
 * colour spreading into the kit's soft fields; a mouse moving over it adds
 * further sources, each a kernel born where the pointer was, which spread and
 * fade the same way.
 *
 * This is the site's one piece of decoration that is also a true statement:
 * the doctoral work is on sharp estimates of heat kernels, and the hero shows
 * one.
 *
 * Two deliberate departures from the pure solution. The peak of each main
 * source is capped at its resting value, so during the spread the text above
 * the field never sits on anything darker than the resting field the kit was
 * measured against (the 13px iris eyebrow at 4.94:1). And the sum is drawn on a
 * coarse grid and upscaled: the field is smooth, so bilinear scaling of a
 * 96-column canvas is indistinguishable from a per-pixel evaluation and costs
 * a hundredth as much.
 *
 * With prefers-reduced-motion the field renders at rest and ignores the mouse.
 */

export type HeatPlacement = "corners" | "bar";

type Source = {
  /** Position in fractions of the field's width and height. */
  x: number;
  y: number;
  /** Peak alpha at rest. The kit's measured-safe values for each placement. */
  peak: number;
  channel: 0 | 1;
};

// Placement matters because the field clips at its own edges. `corners`
// suits a section that ends the page. `bar` is the menu bar: a strip a few
// percent as tall as it is wide, warmed gently from both ends, at peaks low
// enough that every link and the active iris one keep their contrast.
const SOURCES: Record<HeatPlacement, readonly Source[]> = {
  bar: [
    { x: 0.03, y: 0.5, peak: 0.4, channel: 0 },
    { x: 0.97, y: 0.5, peak: 0.36, channel: 1 },
  ],
  corners: [
    { x: 0.08, y: 1.0, peak: 0.75, channel: 0 },
    { x: 0.92, y: 0.0, peak: 0.7, channel: 1 },
  ],
};

// Kit tokens, as RGB. `background` is the page; the deep tints are the kit's
// illustration-only colours and appear nowhere else in the interface.
const BACKGROUND = [248, 249, 252] as const;
const CHANNEL_RGB = [
  [198, 180, 231], // lavender-deep
  [237, 194, 215], // blush-deep
] as const;

const COLS = 96;
/**
 * Where the e-fold radius of a resting source lands, in widths: 4·T = r₀².
 * 0.34 keeps the centre of the field, where the copy sits, within a few
 * percent of the page background; at 0.45 the whole hero took a uniform wash
 * and the two sources stopped reading as two.
 */
const RESTING_SPREAD = 0.34 ** 2 / 4;
const INTRO_MS = 2400;
const INTRO_START = 0.004;
/**
 * Pointer heat, in units of the resting time (one unit is INTRO_MS). A source
 * is born already `SOFTENING` old, so it appears as a soft blob rather than a
 * point and its peak has halved after another SOFTENING; it is dropped at
 * LIFETIME, by which point it is a few percent of the background.
 */
const POINTER_PEAK = 0.26;
/**
 * The menu bar's pointer heat: its links are text set on the field itself.
 * 0.3 is the strongest peak at which the active iris link keeps 4.5:1 where a
 * pointer sweeps over it (measured 4.94:1; 0.4 gave 4.63:1).
 */
const POINTER_PEAK_IN_BAR = 0.3;
/**
 * In the bar a pointer source is sized by the bar's height, not its width: a
 * kernel scaled to a 1280px-wide strip was born three times taller than the
 * 80px bar and read as a faint wash rather than heat leaving the pointer.
 * Born at this e-fold radius, in bar heights, it spreads to about 3.7 times
 * that over its lifetime.
 */
const BAR_BIRTH_RADIUS = 0.4;
/** Columns of the bar's grid: about 4px cells at 1280, so small kernels stay round. */
const BAR_COLS = 320;
const POINTER_SOFTENING = 0.12;
const POINTER_LIFETIME = 1.6;
const POINTER_MIN_SPACING = 0.02;

type PointerSource = { x: number; y: number; bornAt: number };

type FieldState = {
  /** Kernel time of the main sources, in units of the resting time; 1 is at rest. */
  tau: number;
  /** Pointer sources, with their birth in the same clock. */
  pointer: PointerSource[];
  /** The running clock the pointer sources age against. */
  clock: number;
};

type FieldGeometry = { cols: number; rows: number; aspect: number };

const geometryFor = (width: number, height: number, cols = COLS): FieldGeometry => {
  const aspect = width > 0 ? height / width : 0.5;
  return { cols, rows: Math.max(16, Math.min(160, Math.round(cols * aspect))), aspect };
};

/**
 * How pointer heat behaves in a field: its fresh peak, its diffusivity (in
 * widths² per unit of time), and whether the top and bottom edges are
 * insulated. An insulated edge reflects heat instead of losing it, which on a
 * strip is the sum of each source and its mirror images across both edges.
 */
type PointerModel = { peak: number; diffusivity: number; insulated: boolean };

const pointerModel = (placement: HeatPlacement, aspect: number): PointerModel =>
  placement === "bar"
    ? {
        peak: POINTER_PEAK_IN_BAR,
        diffusivity: (BAR_BIRTH_RADIUS * aspect) ** 2 / (4 * POINTER_SOFTENING),
        insulated: true,
      }
    : { peak: POINTER_PEAK, diffusivity: RESTING_SPREAD, insulated: false };

/** One evaluation of the summed kernels onto the canvas. */
const paint = (
  ctx: CanvasRenderingContext2D,
  geometry: FieldGeometry,
  sources: readonly Source[],
  state: FieldState,
  model: PointerModel,
) => {
  const { cols, rows, aspect } = geometry;
  const image = ctx.createImageData(cols, rows);
  const data = image.data;
  const tau = Math.max(state.tau, INTRO_START);
  const mainVariance = 4 * RESTING_SPREAD * tau;

  const pointers = state.pointer.map((p) => {
    const age = state.clock - p.bornAt + POINTER_SOFTENING;
    return {
      x: p.x,
      y: p.y,
      variance: 4 * model.diffusivity * age,
      // Q / 4πt, scaled so a fresh source peaks at the placement's peak.
      peak: (model.peak * POINTER_SOFTENING) / age,
    };
  });

  for (let row = 0; row < rows; row++) {
    // Positions in units of the width, so a kernel is round on screen.
    const y = ((row + 0.5) / rows) * aspect;
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) / cols;
      const alpha = [0, 0];

      for (const source of sources) {
        const dx = x - source.x;
        const dy = y - source.y * aspect;
        // Q / 4πt · e^(−r²/4t), with Q chosen so the resting peak is `peak`;
        // the cap keeps the text above the field on the contrast it was
        // measured against while the source is still concentrated.
        const value = (source.peak / tau) * Math.exp(-(dx * dx + dy * dy) / mainVariance);
        alpha[source.channel] += Math.min(value, source.peak);
      }
      for (const p of pointers) {
        const dx = x - p.x;
        const near = (sourceY: number) =>
          p.peak * Math.exp(-(dx * dx + (y - sourceY) ** 2) / p.variance);
        alpha[0] += near(p.y * aspect);
        if (model.insulated) {
          // Mirror images across the top (y = 0) and bottom (y = aspect).
          alpha[0] += near(-p.y * aspect) + near((2 - p.y) * aspect);
        }
      }

      let r = BACKGROUND[0];
      let g = BACKGROUND[1];
      let b = BACKGROUND[2];
      for (let channel = 0; channel < 2; channel++) {
        const a = Math.min(alpha[channel], 0.85);
        if (a <= 0) continue;
        const [cr, cg, cb] = CHANNEL_RGB[channel];
        r += (cr - r) * a;
        g += (cg - g) * a;
        b += (cb - b) * a;
      }
      const offset = (row * cols + col) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
};

// Static grain rendered once into a small tile and repeated, instead of a
// full-size feTurbulence filter that mobile Safari repaints slowly.
const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.09 0 0 0 0 0.14 0 0 0 0 0.24 0 0 0 1 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>',
)}")`;

const grainStyle: CSSProperties = {
  backgroundImage: GRAIN_TILE,
  backgroundSize: "160px 160px",
  opacity: 0.06,
  mixBlendMode: "multiply",
};

type HeatFieldProps = HTMLAttributes<HTMLDivElement> & {
  placement?: HeatPlacement;
  /** Spread from the sources once on mount and take heat from the mouse. */
  live?: boolean;
};

const HeatField = ({
  placement = "corners",
  live = false,
  className,
  children,
  onPointerMove: onPointerMoveProp,
  ...props
}: HeatFieldProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const animated = live && !prefersReducedMotion;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geometryRef = useRef<FieldGeometry>(geometryFor(16, 9));
  const stateRef = useRef<FieldState>({
    tau: animated ? INTRO_START : 1,
    pointer: [],
    clock: 0,
  });
  const frameRef = useRef<number | null>(null);
  const introStartRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const sources = SOURCES[placement];

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { cols, rows } = geometryRef.current;
    if (canvas.width !== cols || canvas.height !== rows) {
      canvas.width = cols;
      canvas.height = rows;
    }
    paint(
      ctx,
      geometryRef.current,
      sources,
      stateRef.current,
      pointerModel(placement, geometryRef.current.aspect),
    );
  };

  // One frame of the clock. Runs while the intro plays or pointer heat is
  // still visible, then stops: a field at rest costs nothing.
  const step = (now: number) => {
    frameRef.current = null;
    const state = stateRef.current;
    const last = lastFrameRef.current ?? now;
    lastFrameRef.current = now;
    // The clock advances in resting-time units at the intro's own rate.
    state.clock += (now - last) / INTRO_MS;

    if (introStartRef.current !== null) {
      const progress = Math.min(1, (now - introStartRef.current) / INTRO_MS);
      // A cubic ease-out, a degree gentler than the kit's entrance curve: a
      // Gaussian's visible edge grows with √t, so a steeper curve spends the
      // whole spread in the first half second.
      state.tau = INTRO_START + (1 - INTRO_START) * easeOutCubic(progress);
      if (progress >= 1) introStartRef.current = null;
    }
    state.pointer = state.pointer.filter((p) => state.clock - p.bornAt < POINTER_LIFETIME);

    draw();
    if (introStartRef.current !== null || state.pointer.length > 0) {
      frameRef.current = requestAnimationFrame(step);
    } else {
      lastFrameRef.current = null;
    }
  };

  const schedule = () => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(step);
  };

  // Size the grid to the element's aspect and paint; repaint on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      geometryRef.current = geometryFor(width, height, placement === "bar" ? BAR_COLS : COLS);
      draw();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
    // draw reads refs only; sources is fixed by placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  useEffect(() => {
    if (animated) {
      introStartRef.current = performance.now();
      stateRef.current.tau = INTRO_START;
      schedule();
    } else {
      stateRef.current = { tau: 1, pointer: [], clock: 0 };
      draw();
    }
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, placement]);

  // A mouse over the field is a moving heat source. Touch is excluded: on a
  // phone the same gesture is a scroll.
  // A caller's own handler runs as well, never instead.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMoveProp?.(event);
    if (!animated || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const last = lastPointerRef.current;
    if (
      last &&
      Math.hypot(x - last.x, (y - last.y) * geometryRef.current.aspect) < POINTER_MIN_SPACING
    )
      return;
    lastPointerRef.current = { x, y };
    stateRef.current.pointer.push({ x, y, bornAt: stateRef.current.clock });
    schedule();
  };

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-background", className)}
      onPointerMove={onPointerMove}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={grainStyle}
      />
      {children}
    </div>
  );
};

export default HeatField;
