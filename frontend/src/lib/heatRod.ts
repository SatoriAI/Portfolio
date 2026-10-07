/**
 * Heat in a rod of length 1 with insulated ends, one section of which starts
 * hot (temperature 1) and the rest cold (0). The figure on the research page
 * draws this one process; nothing here is the Jacobi heat kernel.
 *
 * On the whole line the solution is a sum of error functions; the insulated
 * ends are mirrors, so the hot section is reflected across 0 and 1. For the
 * times the figure shows (t <= T_MAX), two reflections each way leave an
 * error far below what a colour can show.
 */

/** Where the rod starts hot, and the region the question is about. */
export const HOT: readonly [number, number] = [0.14, 0.26];
export const REGION_A: readonly [number, number] = [0.68, 0.8];

/** The slider's far end: heat has reached A, but the rod is not yet even. */
export const T_MAX = 0.12;

/** The slider runs 0–100; time grows as its square, so the early spread, which
 * is quick, is not over in the first few steps. */
export const timeAt = (position: number) => T_MAX * (position / 100) ** 2;

// Abramowitz and Stegun 7.1.26: absolute error below 1.5e-7.
const erf = (x: number) => {
  const sign = Math.sign(x);
  const a = Math.abs(x);
  const k = 1 / (1 + 0.3275911 * a);
  const poly =
    ((((1.061405429 * k - 1.453152027) * k + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k;
  return sign * (1 - poly * Math.exp(-a * a));
};

const IMAGES = [-2, -1, 0, 1, 2];

/** Temperature at x in [0, 1] after time t. At t = 0, exactly the hot section. */
export const temperature = (x: number, t: number) => {
  const [from, to] = HOT;
  if (t <= 0) return x >= from && x <= to ? 1 : 0;
  const spread = 2 * Math.sqrt(t);
  let sum = 0;
  for (const k of IMAGES) {
    for (const [p, q] of [
      [from + 2 * k, to + 2 * k],
      [-to + 2 * k, -from + 2 * k],
    ]) {
      sum += 0.5 * (erf((x - p) / spread) - erf((x - q) / spread));
    }
  }
  return sum;
};

/** Temperatures at the centres of `cells` equal cells along the rod. */
export const sampleRod = (t: number, cells: number) =>
  Array.from({ length: cells }, (_, i) => temperature((i + 0.5) / cells, t));

/** Mean temperature over region A. */
export const heatInA = (t: number) => {
  const [from, to] = REGION_A;
  const steps = 20;
  let sum = 0;
  for (let i = 0; i <= steps; i++) sum += temperature(from + ((to - from) * i) / steps, t);
  return sum / (steps + 1);
};

/**
 * How strongly a temperature is painted, 0–1. A power below one keeps the
 * faint heat that reaches A visible; much below 0.6 and the late rod reads
 * as one even colour, hiding that the start is still the warmest part.
 */
export const shade = (value: number) => Math.min(1, Math.max(0, value)) ** 0.6;

export type RodState = "concentrated" | "spreading" | "reached";

/** Heat in A that the figure paints visibly (shade ≈ 0.1). */
const REACHED = 0.02;
/** While the hot section still holds most of its heat, it reads as concentrated. */
const CONCENTRATED = 0.6;

/** Which sentence describes the rod at time t. */
export const rodState = (t: number): RodState => {
  if (heatInA(t) >= REACHED) return "reached";
  const [from, to] = HOT;
  return temperature((from + to) / 2, t) >= CONCENTRATED ? "concentrated" : "spreading";
};

/**
 * The slider's first position at which the heat has reached A: where the
 * figure's own run stops, on the moment the sentence changes.
 */
export const REACHED_POSITION = (() => {
  for (let position = 0; position <= 100; position += 1) {
    if (rodState(timeAt(position)) === "reached") return position;
  }
  return 100;
})();

/** Tallest ripple on a rod edge, in px, where the rod is at its hottest. */
export const RIPPLE_MAX = 3;
/** Distance between ripple crests, in px. */
const RIPPLE_WAVELENGTH = 22;

/**
 * How far an edge ripples at a temperature, in px. A power above one on the
 * shade keeps the ripple on the hot part: lukewarm stretches barely stir.
 */
export const rippleAt = (value: number) => RIPPLE_MAX * shade(value) ** 1.5;

/**
 * Ripple heights along the rod, one per cell, blurred so the ripple swells in
 * from nothing across `radius` cells either side of a hot edge instead of
 * starting at full height. Without it the sharp start of the hot section
 * reads as a notched block, not a shimmer.
 */
export const rippleProfile = (cells: readonly number[], radius: number) => {
  const raw = cells.map(rippleAt);
  const blur = (values: number[]) =>
    values.map((_, i) => {
      let sum = 0;
      let count = 0;
      for (let j = i - radius; j <= i + radius; j++) {
        if (j >= 0 && j < values.length) {
          sum += values[j];
          count++;
        }
      }
      return sum / count;
    });
  // Two box blurs: close enough to a Gaussian that the swell has no corners.
  return blur(blur(raw));
};

type Outline = {
  /** The rod's size in px, ripples excluded. */
  width: number;
  height: number;
  /** Space above and below the rod for the ripples, in px. */
  inset: number;
  /** Ripple height at a distance x px from the rod's left end. */
  amplitude: (x: number) => number;
  /** Where along its cycle the ripple is, in radians. */
  phase: number;
};

/**
 * The rod as a pill whose long edges ripple where it is warm: an SVG path in
 * px, top edge left to right, round right end, bottom edge back, round left
 * end. The ripple fades out over the round ends, so the arcs meet the edges
 * cleanly, and the two edges move in opposite directions, so the rod swells
 * and narrows as a hot thing seems to.
 */
export const rodOutline = ({ width, height, inset, amplitude, phase }: Outline) => {
  const r = height / 2;
  const top = inset;
  const bottom = inset + height;
  const step = 3;
  const xs: number[] = [];
  for (let x = r; x < width - r; x += step) xs.push(x);
  xs.push(width - r);
  const taper = (x: number) => Math.min(1, (x - r) / r, (width - r - x) / r);
  const ripple = (x: number) =>
    amplitude(x) * Math.max(0, taper(x)) * Math.sin((2 * Math.PI * x) / RIPPLE_WAVELENGTH - phase);
  const f = (n: number) => n.toFixed(2);
  const topEdge = xs.map((x) => `L${f(x)} ${f(top - ripple(x))}`).join("");
  const bottomEdge = [...xs]
    .reverse()
    .map((x) => `L${f(x)} ${f(bottom + ripple(x))}`)
    .join("");
  return (
    `M${f(r)} ${f(top)}${topEdge}` +
    `A${f(r)} ${f(r)} 0 0 1 ${f(width - r)} ${f(bottom)}` +
    `${bottomEdge}A${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(top)}Z`
  );
};
