/**
 * The arithmetic behind "The hidden gradient" on the Research page: diffusion
 * and multiplication, applied in two orders, and the difference between them.
 * Kept out of the component so it can be tested in node.
 *
 * On the periodic interval [0, 1), diffusion for time t is the heat semigroup
 * of the second derivative: it scales the Fourier mode e^(2πikx) by
 * e^(−4π²k²t). For two functions b and u, the defect
 *
 *   D_t = (P_t(b·u) − (P_t b)(P_t u)) / (2t)
 *
 * tends to b′·u′ as t → 0, since P_t ≈ 1 + t·d²/dx² and
 * (bu)″ − b″u − bu″ = 2b′u′. The functions here are trigonometric polynomials,
 * so every value is computed exactly from their modes; nothing is simulated.
 */

/** A trigonometric polynomial: its complex Fourier coefficients by frequency. */
export type Modes = ReadonlyMap<number, readonly [number, number]>;

const TAU = 2 * Math.PI;

const add = (into: Map<number, [number, number]>, k: number, re: number, im: number) => {
  const [r, i] = into.get(k) ?? [0, 0];
  into.set(k, [r + re, i + im]);
};

/** a + c·cos(2πkx + φ) + s·sin(2πkx + φ), as modes. */
export const trig = (
  constant: number,
  terms: { k: number; cos?: number; sin?: number; phase?: number }[],
) => {
  const modes = new Map<number, [number, number]>();
  if (constant) add(modes, 0, constant, 0);
  for (const { k, cos = 0, sin = 0, phase = 0 } of terms) {
    // c·cos(θ) + s·sin(θ), θ = 2πkx + φ, is Re of (c − i·s)·e^(iφ)·e^(2πikx), split over ±k.
    const re = cos * Math.cos(phase) + sin * Math.sin(phase);
    const im = cos * Math.sin(phase) - sin * Math.cos(phase);
    add(modes, k, re / 2, im / 2);
    add(modes, -k, re / 2, -im / 2);
  }
  return modes as Modes;
};

/** The product of two trigonometric polynomials. */
export const multiply = (f: Modes, g: Modes): Modes => {
  const product = new Map<number, [number, number]>();
  for (const [k, [a, b]] of f)
    for (const [l, [c, d]] of g) add(product, k + l, a * c - b * d, a * d + b * c);
  return product;
};

/** Diffusion for time t: each mode damped by e^(−4π²k²t). */
export const diffuse = (f: Modes, t: number): Modes =>
  new Map(
    [...f].map(
      ([k, [re, im]]) =>
        [
          k,
          [re * Math.exp(-TAU * TAU * k * k * t), im * Math.exp(-TAU * TAU * k * k * t)],
        ] as const,
    ),
  );

/** The derivative: each mode multiplied by 2πik. */
export const derivative = (f: Modes): Modes =>
  new Map([...f].map(([k, [re, im]]) => [k, [-TAU * k * im, TAU * k * re]] as const));

/** f(x), real because the modes come in conjugate pairs. */
export const evaluate = (f: Modes, x: number) => {
  let value = 0;
  for (const [k, [re, im]] of f) value += re * Math.cos(TAU * k * x) - im * Math.sin(TAU * k * x);
  return value;
};

/** The material: positive, varying once around the loop. */
export const B = trig(1, [{ k: 1, cos: 0.6 }]);
/** The current state: two oscillations, shifted so b′·u′ is not symmetric. */
export const U = trig(0, [{ k: 2, sin: 1, phase: 0.4 }]);

/** b′·u′: what the defect tends to. */
export const gradientProduct = (b: Modes = B, u: Modes = U) =>
  multiply(derivative(b), derivative(u));

/** (P_t(b·u) − (P_t b)(P_t u)) / (2t). */
export const defect = (t: number, b: Modes = B, u: Modes = U): Modes => {
  const both = diffuse(multiply(b, u), t);
  const apart = multiply(diffuse(b, t), diffuse(u, t));
  const difference = new Map<number, [number, number]>();
  for (const [k, [re, im]] of both) add(difference, k, re / (2 * t), im / (2 * t));
  for (const [k, [re, im]] of apart) add(difference, k, -re / (2 * t), -im / (2 * t));
  return difference;
};

/** The diffusion times the slider spans, longest first. */
export const T_LONG = 0.02;
export const T_SHORT = 0.00005;
/**
 * Where the slider rests after its first run: short enough that the defect
 * lies on b′·u′.
 */
export const GRADIENT_REST = 0.85;

/** The slider's position, 0 (long) to 1 (short), as a time: even steps on a log scale. */
export const timeAt = (position: number) => T_LONG * (T_SHORT / T_LONG) ** position;

/** The largest gap between the defect and b′·u′, as a share of b′·u′'s largest value. */
export const relativeGap = (t: number, samples = 400) => {
  const target = gradientProduct();
  const approximation = defect(t);
  let gap = 0;
  let size = 0;
  for (let i = 0; i < samples; i += 1) {
    const x = i / samples;
    const exact = evaluate(target, x);
    gap = Math.max(gap, Math.abs(evaluate(approximation, x) - exact));
    size = Math.max(size, Math.abs(exact));
  }
  return gap / size;
};

export type GradientReading = "far" | "closer" | "matches";

/** Which sentence describes the gap: over a half, over a twentieth, or under. */
export const gradientReading = (gap: number): GradientReading =>
  gap > 0.5 ? "far" : gap > 0.05 ? "closer" : "matches";
