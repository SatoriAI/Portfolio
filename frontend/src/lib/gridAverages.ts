/**
 * The arithmetic behind the two figures in "Does diffusion keep its
 * character?": what a periodic grid of cell averages keeps of a fine wave,
 * and why the average of a product is not the product of the averages. Kept
 * out of the components so it can be tested in node.
 *
 * The wave is u(x) = sin(2πkx + φ) on the periodic interval [0, 1), cut into
 * n equal cells of width h = 1/n. Its average over cell j is exactly
 *
 *   sinc(πk/n) · sin(2πk·c_j + φ),   c_j = (j + ½)/n,   sinc(z) = sin(z)/z,
 *
 * so averaging scales the wave by sinc(πk/n), which is zero when n divides k.
 * On the cell centres a wave with k oscillations agrees, up to its sign, with
 * one of f oscillations, where f is k folded into [0, n/2]: that is aliasing.
 */

/** How many times the figure's wave oscillates over the period. */
export const WAVES = 5;
/** The wave's phase: away from zero, so only a grid that divides k loses it. */
export const PHASE = 0.6;
/** The coarsest and the finest grid the figure offers, in cells. */
export const CELLS_MIN = 3;
export const CELLS_MAX = 30;
/** The grid shown first: one that already sees a slower wave. */
export const CELLS_DEFAULT = 8;

const sinc = (z: number) => (z === 0 ? 1 : Math.sin(z) / z);

/** The wave itself at x. */
export const wave = (x: number, k = WAVES, phase = PHASE) => Math.sin(2 * Math.PI * k * x + phase);

/** How much of the wave's height the cell averages keep, with its sign. */
export const keptFactor = (k: number, n: number) => sinc((Math.PI * k) / n);

/** The exact average of the wave over each of n equal cells. */
export const cellAverages = (n: number, k = WAVES, phase = PHASE) =>
  Array.from(
    { length: n },
    (_, j) => keptFactor(k, n) * Math.sin(2 * Math.PI * k * ((j + 0.5) / n) + phase),
  );

/** The number of oscillations the grid sees: k folded into [0, n/2]. */
export const seenWaves = (k: number, n: number) => {
  const r = k % n;
  return Math.min(r, n - r);
};

/**
 * The slowest wave through the cell averages at the cell centres: what the
 * grid takes the input for. Exact at every centre (see the module comment).
 */
export const seenWave = (x: number, n: number, k = WAVES, phase = PHASE) => {
  const m = Math.floor(k / n);
  const r = k % n;
  const s = keptFactor(k, n);
  return 2 * r <= n
    ? s * Math.sin(2 * Math.PI * r * x + phase + Math.PI * m)
    : s * Math.sin(phase + Math.PI * (m + 1) - 2 * Math.PI * (n - r) * x);
};

export type GridReading = "follows" | "slower" | "vanished";

/** Which sentence describes what an n-cell grid makes of k oscillations. */
export const gridReading = (k: number, n: number): GridReading => {
  const f = seenWaves(k, n);
  if (f === 0) return "vanished";
  return f === k ? "follows" : "slower";
};

/** The share of the wave's height the averages keep, in whole percent. */
export const keptPercent = (k: number, n: number) =>
  // A grid that divides k keeps nothing; sin(π·m) is not exactly zero in floating point.
  seenWaves(k, n) === 0 ? 0 : Math.round(Math.abs(keptFactor(k, n)) * 100);

/**
 * How the periodic Laplacian acts on the Fourier mode e^(2πiℓx): it scales
 * it by its symbol, 4π²ℓ² for the continuous operator and (4/h²)·sin²(πhℓ)
 * for the nearest-neighbour operator on a grid of n cells, h = 1/n, which
 * only has modes up to ℓ = n/2. Textbook facts, not the paper's estimates.
 */
export const continuousSymbol = (l: number) => 4 * Math.PI ** 2 * l ** 2;

export const latticeSymbol = (l: number, n: number) =>
  4 * n ** 2 * Math.sin((Math.PI * l) / n) ** 2;

/**
 * The lattice symbol as a share of the continuous one: near 1 for slow modes,
 * falling to 4/π² ≈ 0.41 at the grid's limit of resolution, ℓ = n/2.
 */
export const symbolRatio = (l: number, n: number) => {
  const z = (Math.PI * l) / n;
  return z === 0 ? 1 : (Math.sin(z) / z) ** 2;
};

/** The highest frequency an n-cell grid can carry. */
export const bandEdge = (n: number) => n / 2;

/** The mean of a list of values. */
export const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * Two functions on the two halves of one cell, b = (1, 3) and u = (2 + d,
 * 2 − d): d = 1 is the piece's own example, u = (3, 1). The mean of u stays
 * 2 whatever d is, so the product of the means stays 4, and only how u moves
 * against b changes the mean of the product.
 */
export const B_VALUES = [1, 3] as const;

export const productExample = (d: number) => {
  const b = [...B_VALUES];
  const u = [2 + d, 2 - d];
  const product = b.map((value, i) => value * u[i]);
  const meanB = mean(b);
  const meanU = mean(u);
  return {
    b,
    u,
    product,
    meanB,
    meanU,
    meanOfProduct: mean(product),
    productOfMeans: meanB * meanU,
    covariance: mean(b.map((value, i) => (value - meanB) * (u[i] - meanU))),
  };
};
