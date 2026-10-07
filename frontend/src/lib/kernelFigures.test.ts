import { describe, expect, it } from "vitest";

import {
  boundPoints,
  discStops,
  heatRadius,
  LOWER,
  RIM_REACH,
  rimAmplitude,
  shape,
  spreadAt,
  strengthAt,
  T_MAX,
  T_MIN,
  timeAt,
  UPPER,
  wavyRim,
} from "./kernelFigures";

const plot = { left: 0, right: 100, top: 0, bottom: 100 };

describe("influence", () => {
  const radii = (d: string, cx: number, cy: number) =>
    [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) =>
      Math.hypot(Number(m[1]) - cx, Number(m[2]) - cy),
    );

  it("is one roughly round disc: its rim strays only a little from the radius", () => {
    const radius = 60;
    const reach = rimAmplitude(radius) * RIM_REACH;
    const r = radii(wavyRim(100, 80, radius, 1.4), 100, 80);
    expect(Math.min(...r)).toBeGreaterThanOrEqual(radius - reach - 0.01);
    expect(Math.max(...r)).toBeLessThanOrEqual(radius + reach + 0.01);
    expect(reach / radius).toBeLessThan(0.15);
  });

  it("has an irregular edge: its bumps are not all the same height", () => {
    const radius = 60;
    const r = radii(wavyRim(0, 0, radius, 0.8), 0, 0);
    // Local maxima of the radius: bumps round the rim.
    const peaks = r.filter(
      (v, i) => v > r[(i + r.length - 1) % r.length] && v > r[(i + 1) % r.length],
    );
    const heights = peaks.map((p) => p - radius);
    expect(peaks.length).toBeGreaterThan(3);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(1);
  });

  it("changes shape as time runs", () => {
    expect(wavyRim(100, 80, 60, 0)).not.toEqual(wavyRim(100, 80, 60, 0.3));
  });

  it("is darkest at the pulse and still visible at the rim", () => {
    const stops = discStops(1);
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].opacity).toBeLessThan(stops[i - 1].opacity);
    }
    expect(stops[0].opacity).toBeCloseTo(1);
    expect(stops[stops.length - 1].opacity).toBeGreaterThan(0.2);
  });

  it("keeps its rim inside the cone's reach, so the ripple stays in view", () => {
    expect(heatRadius(spreadAt(0))).toBeLessThan(25);
    expect(heatRadius(spreadAt(1))).toBeLessThan(120);
  });

  it("spreads wider and weaker as time passes", () => {
    const early = spreadAt(0);
    const late = spreadAt(1);
    expect(heatRadius(late)).toBeGreaterThan(heatRadius(early));
    expect(strengthAt(late)).toBeLessThan(strengthAt(early));
    expect(strengthAt(early)).toBe(1);
    // Still clearly visible at the far end of the slider.
    expect(strengthAt(late)).toBeGreaterThan(0.35);
  });
});

describe("sharp bounds", () => {
  it("are one shape times two constants, at every distance and time", () => {
    for (const t of [T_MIN, 0.08, T_MAX]) {
      const upper = boundPoints(UPPER, t, plot);
      const lower = boundPoints(LOWER, t, plot);
      upper.forEach(([, yu], i) => {
        const [, yl] = lower[i];
        // Heights above the axis keep one ratio: the same rule, scaled.
        const hu = plot.bottom - yu;
        const hl = plot.bottom - yl;
        if (hl > 1e-6) expect(hu / hl).toBeCloseTo(UPPER / LOWER);
      });
    }
  });

  it("are not a narrow band around one curve", () => {
    expect(UPPER / LOWER).toBeGreaterThan(2);
  });

  it("change with time: the shared shape widens and lowers", () => {
    expect(shape(0, timeAt(1))).toBeLessThan(shape(0, timeAt(0)));
    expect(shape(0.4, timeAt(1))).toBeGreaterThan(shape(0.4, timeAt(0)));
  });

  it("stay inside the plot at every time", () => {
    for (const s of [0, 0.5, 1]) {
      for (const [, y] of boundPoints(UPPER, timeAt(s), plot)) {
        expect(y).toBeGreaterThanOrEqual(plot.top - 1e-9);
        expect(y).toBeLessThanOrEqual(plot.bottom);
      }
    }
  });
});
