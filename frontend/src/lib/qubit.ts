/**
 * One qubit, exactly. A state is a pair of complex amplitudes, a gate is a
 * 2×2 unitary, and the Bloch vector is read off the state. Kept out of the
 * figure that draws it so the arithmetic can be tested without a browser.
 */

export type Complex = { re: number; im: number };
export type Qubit = { alpha: Complex; beta: Complex };
export type GateName = "H" | "X" | "Z" | "S" | "T";

export type Gate = {
  name: GateName;
  matrix: [[Complex, Complex], [Complex, Complex]];
  /** The rotation of the Bloch sphere the gate performs: unit axis and angle. */
  axis: [number, number, number];
  angle: number;
};

const c = (re: number, im = 0): Complex => ({ re, im });
const add = (a: Complex, b: Complex): Complex => c(a.re + b.re, a.im + b.im);
const mul = (a: Complex, b: Complex): Complex =>
  c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conj = (a: Complex): Complex => c(a.re, -a.im);
const phase = (theta: number): Complex => c(Math.cos(theta), Math.sin(theta));

const ROOT_HALF = Math.SQRT1_2;

export const GATES: Record<GateName, Gate> = {
  H: {
    name: "H",
    matrix: [
      [c(ROOT_HALF), c(ROOT_HALF)],
      [c(ROOT_HALF), c(-ROOT_HALF)],
    ],
    axis: [ROOT_HALF, 0, ROOT_HALF],
    angle: Math.PI,
  },
  X: {
    name: "X",
    matrix: [
      [c(0), c(1)],
      [c(1), c(0)],
    ],
    axis: [1, 0, 0],
    angle: Math.PI,
  },
  Z: {
    name: "Z",
    matrix: [
      [c(1), c(0)],
      [c(0), c(-1)],
    ],
    axis: [0, 0, 1],
    angle: Math.PI,
  },
  S: {
    name: "S",
    matrix: [
      [c(1), c(0)],
      [c(0), phase(Math.PI / 2)],
    ],
    axis: [0, 0, 1],
    angle: Math.PI / 2,
  },
  T: {
    name: "T",
    matrix: [
      [c(1), c(0)],
      [c(0), phase(Math.PI / 4)],
    ],
    axis: [0, 0, 1],
    angle: Math.PI / 4,
  },
};

export const ZERO: Qubit = { alpha: c(1), beta: c(0) };

export const applyGate = (state: Qubit, gate: Gate): Qubit => {
  const [[a, b], [d, e]] = gate.matrix;
  return {
    alpha: add(mul(a, state.alpha), mul(b, state.beta)),
    beta: add(mul(d, state.alpha), mul(e, state.beta)),
  };
};

/** Bloch vector (x, y, z) of a pure state: ⟨σₓ⟩, ⟨σᵧ⟩, ⟨σ_z⟩. */
export const blochVector = (state: Qubit): [number, number, number] => {
  const cross = mul(conj(state.alpha), state.beta);
  const norm2 = (v: Complex) => v.re * v.re + v.im * v.im;
  return [2 * cross.re, 2 * cross.im, norm2(state.alpha) - norm2(state.beta)];
};

export const probabilities = (state: Qubit): [number, number] => {
  const norm2 = (v: Complex) => v.re * v.re + v.im * v.im;
  return [norm2(state.alpha), norm2(state.beta)];
};

/** Rodrigues' rotation of a vector about a unit axis, for animating a gate. */
export const rotate = (
  v: [number, number, number],
  axis: [number, number, number],
  angle: number,
): [number, number, number] => {
  const [x, y, z] = v;
  const [kx, ky, kz] = axis;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = kx * x + ky * y + kz * z;
  const crossX = ky * z - kz * y;
  const crossY = kz * x - kx * z;
  const crossZ = kx * y - ky * x;
  return [
    x * cos + crossX * sin + kx * dot * (1 - cos),
    y * cos + crossY * sin + ky * dot * (1 - cos),
    z * cos + crossZ * sin + kz * dot * (1 - cos),
  ];
};

/** "0.71 + 0.71i", with a zero part dropped; for the amplitude readout. */
export const formatComplex = (v: Complex, digits = 2): string => {
  const re = Number(v.re.toFixed(digits));
  const im = Number(v.im.toFixed(digits));
  const fmt = (n: number) => (Object.is(n, -0) ? 0 : n).toFixed(digits);
  if (im === 0) return fmt(re);
  if (re === 0) return `${fmt(im)}i`;
  return `${fmt(re)} ${im < 0 ? "−" : "+"} ${fmt(Math.abs(im))}i`;
};
