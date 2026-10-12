import type { CSSProperties } from "react";

/**
 * The heat kernel of the plane, and how the site paints it.
 *
 * u(x, t) = Q / 4πDt · e^(−|x|²/4Dt) is the solution of ∂ₜu = DΔu for a point
 * source: its width grows as √t and its peak falls as 1/t. Every warm field on
 * the site is a sum of these — the menu bar and the closing sections
 * (HeatField), and the projects on the home page (ProjectField) — so they are
 * one implementation, in any units the caller chooses.
 *
 * A kernel is written by its peak at a reference age rather than by Q, since
 * the peak is what the kit measures contrast against: at age `scale` it
 * peaks at `peak`, and at age a it peaks at peak · scale / a.
 */

/** The value of one kernel at squared distance `r2` from its source, at `age`. */
export const kernel = (peak: number, scale: number, diffusivity: number, age: number, r2: number) =>
  ((peak * scale) / age) * Math.exp(-r2 / (4 * diffusivity * age));

/**
 * A source born at a moment of a running clock: its kernel's age is the time
 * since, plus `scale`, so it is born already soft rather than as a point.
 */
export type HeatSource = { x: number; y: number; bornAt: number };

/** How the sources of one kind behave: fresh peak, its age, spread, and how long they last. */
export type HeatModel = { peak: number; scale: number; diffusivity: number; lifetime: number };

// Never younger than at birth: a source stamped a moment after the clock was
// read (late in a long frame) must not have a negative age, where the
// kernel is no longer a kernel.
const ageOf = (source: HeatSource, model: HeatModel, clock: number) =>
  Math.max(0, clock - source.bornAt) + model.scale;

/** Whether a source has faded past its model's lifetime. */
export const expired = (source: HeatSource, model: HeatModel, clock: number) =>
  clock - source.bornAt >= model.lifetime;

/** The summed heat of the sources at (x, y). */
/** A source's kernel at one moment, ready to sample at many points (see prepare). */
export type PreparedKernel = {
  x: number;
  y: number;
  amplitude: number;
  spread: number;
  reach: number;
};

/** Below this a kernel adds nothing a painted cell can show (half of one 8-bit step). */
const INVISIBLE = 1 / 512;

/**
 * The sources' kernels at `clock`, worked out once for a whole painting:
 * each one's amplitude, its 4Dt, and the squared distance beyond which it
 * is invisible, so a cell far from a source skips it without an exp().
 */
export const prepare = (
  sources: readonly HeatSource[],
  model: HeatModel,
  clock: number,
): PreparedKernel[] => {
  const kernels: PreparedKernel[] = [];
  for (const source of sources) {
    const age = ageOf(source, model, clock);
    const amplitude = (model.peak * model.scale) / age;
    if (amplitude <= INVISIBLE) continue;
    const spread = 4 * model.diffusivity * age;
    kernels.push({
      x: source.x,
      y: source.y,
      amplitude,
      spread,
      reach: spread * Math.log(amplitude / INVISIBLE),
    });
  }
  return kernels;
};

/** The summed heat of prepared kernels at (x, y). */
export const preparedHeatAt = (kernels: readonly PreparedKernel[], x: number, y: number) => {
  let sum = 0;
  for (const k of kernels) {
    const r2 = (x - k.x) ** 2 + (y - k.y) ** 2;
    if (r2 < k.reach) sum += k.amplitude * Math.exp(-r2 / k.spread);
  }
  return sum;
};

export const heatAt = (
  sources: readonly HeatSource[],
  model: HeatModel,
  x: number,
  y: number,
  clock: number,
) => {
  let sum = 0;
  for (const source of sources) {
    const r2 = (x - source.x) ** 2 + (y - source.y) ** 2;
    sum += kernel(model.peak, model.scale, model.diffusivity, ageOf(source, model, clock), r2);
  }
  return sum;
};

/**
 * The gradient of the summed heat at (x, y): it points up the slope, toward
 * the warmth. Of one kernel, ∇u = −u · (x − x₀) / 2Dt.
 */
export const heatGradient = (
  sources: readonly HeatSource[],
  model: HeatModel,
  x: number,
  y: number,
  clock: number,
): [number, number] => {
  let gx = 0;
  let gy = 0;
  for (const source of sources) {
    const age = ageOf(source, model, clock);
    const dx = x - source.x;
    const dy = y - source.y;
    const u = kernel(model.peak, model.scale, model.diffusivity, age, dx * dx + dy * dy);
    const k = -u / (2 * model.diffusivity * age);
    gx += k * dx;
    gy += k * dy;
  }
  return [gx, gy];
};

// Kit tokens, as RGB. `background` is the page; the deep tints are the kit's
// illustration-only colours and appear nowhere else in the interface.
const BACKGROUND = [248, 249, 252] as const;
const CHANNEL_RGB = [
  [198, 180, 231], // lavender-deep
  [237, 194, 215], // blush-deep
] as const;
/** No cell is ever painted more than this deep: the text above stays legible. */
const MAX_ALPHA = 0.85;

/**
 * Paints a field onto a canvas of `cols` × `rows` cells, one colour per cell,
 * which the page upscales: the field is smooth, so bilinear scaling of a
 * coarse grid is indistinguishable from a per-pixel evaluation and costs a
 * hundredth as much. `alphaAt` receives each cell's centre as fractions of the
 * width and height, and writes the lavender and blush alpha there into `out`;
 * the colours are mixed over `background`, the page's by default.
 */
// One image per canvas, kept while its size holds: painting every frame
// should not allocate a new one each time. Every pixel is rewritten.
const images = new WeakMap<CanvasRenderingContext2D, ImageData>();
const imageFor = (ctx: CanvasRenderingContext2D, cols: number, rows: number) => {
  const cached = images.get(ctx);
  if (cached && cached.width === cols && cached.height === rows) return cached;
  const image = ctx.createImageData(cols, rows);
  images.set(ctx, image);
  return image;
};

export const paintField = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  alphaAt: (u: number, v: number, out: [number, number]) => void,
  background: readonly [number, number, number] = BACKGROUND,
) => {
  const image = imageFor(ctx, cols, rows);
  const data = image.data;
  const alpha: [number, number] = [0, 0];
  for (let row = 0; row < rows; row++) {
    const v = (row + 0.5) / rows;
    for (let col = 0; col < cols; col++) {
      alpha[0] = 0;
      alpha[1] = 0;
      alphaAt((col + 0.5) / cols, v, alpha);
      let r: number = background[0];
      let g: number = background[1];
      let b: number = background[2];
      for (let channel = 0; channel < 2; channel++) {
        const a = Math.min(alpha[channel], MAX_ALPHA);
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

/** Sizes a canvas to its grid, only when the grid changed (which clears it). */
export const fitCanvas = (canvas: HTMLCanvasElement, cols: number, rows: number) => {
  if (canvas.width !== cols || canvas.height !== rows) {
    canvas.width = cols;
    canvas.height = rows;
  }
};

// Static grain rendered once into a small tile and repeated, instead of a
// full-size feTurbulence filter that mobile Safari repaints slowly.
const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.09 0 0 0 0 0.14 0 0 0 0 0.24 0 0 0 1 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>',
)}")`;

/** The kit's grain, laid over a painted field. */
export const grainStyle: CSSProperties = {
  backgroundImage: GRAIN_TILE,
  backgroundSize: "160px 160px",
  opacity: 0.06,
  mixBlendMode: "multiply",
};
