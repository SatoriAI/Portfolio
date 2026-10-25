import { describe, expect, it } from "vitest";

import {
  B,
  defect,
  derivative,
  diffuse,
  evaluate,
  gradientProduct,
  gradientReading,
  multiply,
  relativeGap,
  T_LONG,
  T_SHORT,
  timeAt,
  trig,
  U,
} from "./hiddenGradient";

const TAU = 2 * Math.PI;
const POINTS = [0, 0.13, 0.37, 0.5, 0.81];

describe("trigonometric polynomials", () => {
  it("evaluate the functions they were built from", () => {
    const f = trig(1, [
      { k: 1, cos: 0.6 },
      { k: 3, sin: 2, phase: 0.4 },
    ]);
    for (const x of POINTS)
      expect(evaluate(f, x)).toBeCloseTo(
        1 + 0.6 * Math.cos(TAU * x) + 2 * Math.sin(3 * TAU * x + 0.4),
        12,
      );
  });

  it("multiply, differentiate and diffuse mode by mode", () => {
    const f = trig(0, [{ k: 2, sin: 1, phase: 0.4 }]);
    const g = trig(1, [{ k: 1, cos: 0.6 }]);
    for (const x of POINTS) {
      expect(evaluate(multiply(f, g), x)).toBeCloseTo(evaluate(f, x) * evaluate(g, x), 12);
      expect(evaluate(derivative(f), x)).toBeCloseTo(2 * TAU * Math.cos(2 * TAU * x + 0.4), 12);
      expect(evaluate(diffuse(f, 0.01), x)).toBeCloseTo(
        Math.exp(-TAU * TAU * 4 * 0.01) * Math.sin(2 * TAU * x + 0.4),
        12,
      );
    }
  });
});

describe("the defect of the two orders", () => {
  it("is exactly the closed form for the figure's b and u", () => {
    // b = 1 + 0.6·cos(2πx), u = sin(4πx + 0.4): the difference keeps the 1st and 3rd modes.
    const t = 0.003;
    const e = (k: number) => Math.exp(-TAU * TAU * k * k * t);
    for (const x of POINTS) {
      const expected =
        (0.3 *
          ((e(3) - e(1) * e(2)) * Math.sin(3 * TAU * x + 0.4) +
            (e(1) - e(1) * e(2)) * Math.sin(TAU * x + 0.4))) /
        (2 * t);
      expect(evaluate(defect(t), x)).toBeCloseTo(expected, 10);
    }
  });

  it("tends to b′·u′ as the diffusion time shrinks", () => {
    for (const x of POINTS)
      expect(evaluate(defect(1e-7), x)).toBeCloseTo(evaluate(gradientProduct(B, U), x), 3);
    expect(relativeGap(T_SHORT)).toBeLessThan(relativeGap(timeAt(0.5)));
    expect(relativeGap(timeAt(0.5))).toBeLessThan(relativeGap(T_LONG));
  });
});

describe("the slider", () => {
  it("runs from the longest time to the shortest on a log scale", () => {
    expect(timeAt(0)).toBeCloseTo(T_LONG, 12);
    expect(timeAt(1)).toBeCloseTo(T_SHORT, 12);
    expect(timeAt(0.5)).toBeCloseTo(Math.sqrt(T_LONG * T_SHORT), 12);
  });

  it("reads far at the long end and matching at the short end", () => {
    expect(gradientReading(relativeGap(T_LONG))).toBe("far");
    expect(gradientReading(relativeGap(timeAt(0.5)))).toBe("closer");
    expect(gradientReading(relativeGap(T_SHORT))).toBe("matches");
  });
});
