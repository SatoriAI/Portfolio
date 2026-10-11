import { describe, expect, it } from "vitest";

import { expired, heatAt, heatGradient, type HeatModel, kernel } from "./heatKernel";

const model: HeatModel = { peak: 0.3, scale: 0.1, diffusivity: 2, lifetime: 1 };

/** Where the kernel falls to half its peak, at `age`. */
const halfWidth = (age: number) => Math.sqrt(4 * model.diffusivity * age * Math.LN2);

describe("kernel", () => {
  it("peaks at `peak` at age `scale`, and falls as 1/t after", () => {
    expect(kernel(0.3, 0.1, 2, 0.1, 0)).toBeCloseTo(0.3);
    expect(kernel(0.3, 0.1, 2, 0.4, 0)).toBeCloseTo(0.075);
  });

  it("widens as √t: four times older, twice as wide", () => {
    for (const age of [0.1, 0.4]) {
      const peak = kernel(0.3, 0.1, 2, age, 0);
      expect(kernel(0.3, 0.1, 2, age, halfWidth(age) ** 2)).toBeCloseTo(peak / 2);
    }
    expect(halfWidth(0.4) / halfWidth(0.1)).toBeCloseTo(2);
  });

  it("falls off with distance", () => {
    const values = [0, 1, 2, 4].map((r) => kernel(0.3, 0.1, 2, 0.2, r * r));
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(values[3]).toBeLessThan(values[0] / 100);
  });
});

describe("heatAt", () => {
  it("sums its sources, each aged from its birth plus the softening", () => {
    const sources = [
      { x: 0, y: 0, bornAt: 0 },
      { x: 0, y: 0, bornAt: 0.3 },
    ];
    // At clock 0.3 the first is 0.4 old and the second freshly born (0.1).
    expect(heatAt(sources, model, 0, 0, 0.3)).toBeCloseTo(0.075 + 0.3);
  });

  it("is zero with no sources", () => {
    expect(heatAt([], model, 1, 1, 0)).toBe(0);
  });
});

describe("heatGradient", () => {
  it("points toward the source, up the slope", () => {
    const source = { x: 3, y: -1, bornAt: 0 };
    const [gx, gy] = heatGradient([source], model, 1, 1, 0.2);
    // From (1, 1) the source lies along (2, −2).
    expect(gx).toBeGreaterThan(0);
    expect(gy).toBeLessThan(0);
    expect(gx).toBeCloseTo(-gy);
  });

  it("matches a finite difference of heatAt", () => {
    const sources = [
      { x: 0.5, y: 0.2, bornAt: 0 },
      { x: -1, y: 1, bornAt: 0.2 },
    ];
    const h = 1e-5;
    const [gx, gy] = heatGradient(sources, model, 0.1, 0.4, 0.5);
    const dx =
      (heatAt(sources, model, 0.1 + h, 0.4, 0.5) - heatAt(sources, model, 0.1 - h, 0.4, 0.5)) /
      (2 * h);
    const dy =
      (heatAt(sources, model, 0.1, 0.4 + h, 0.5) - heatAt(sources, model, 0.1, 0.4 - h, 0.5)) /
      (2 * h);
    expect(gx).toBeCloseTo(dx, 6);
    expect(gy).toBeCloseTo(dy, 6);
  });

  it("is flat at the source itself", () => {
    expect(heatGradient([{ x: 2, y: 2, bornAt: 0 }], model, 2, 2, 0)).toEqual([0, 0]);
  });
});

describe("expired", () => {
  it("drops a source once its lifetime has passed", () => {
    const source = { x: 0, y: 0, bornAt: 1 };
    expect(expired(source, model, 1.99)).toBe(false);
    expect(expired(source, model, 2)).toBe(true);
  });
});
