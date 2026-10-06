import { describe, expect, it } from "vitest";

import {
  heatInA,
  HOT,
  REACHED_POSITION,
  RIPPLE_MAX,
  rippleAt,
  rippleProfile,
  rodOutline,
  rodState,
  sampleRod,
  shade,
  T_MAX,
  temperature,
  timeAt,
} from "./heatRod";

const total = (t: number) => {
  const cells = sampleRod(t, 2000);
  return cells.reduce((sum, value) => sum + value, 0) / cells.length;
};

describe("temperature", () => {
  it("starts as exactly the hot section", () => {
    expect(temperature(0.2, 0)).toBe(1);
    expect(temperature(0.5, 0)).toBe(0);
    expect(temperature(0.74, 0)).toBe(0);
  });

  it("keeps all the heat in the rod: the ends are insulated", () => {
    const initial = HOT[1] - HOT[0];
    for (const t of [0.001, 0.02, T_MAX]) expect(total(t)).toBeCloseTo(initial, 3);
  });

  it("loosens its hold on the hot section as time runs", () => {
    const middle = (HOT[0] + HOT[1]) / 2;
    const peaks = [0, 0.002, 0.02, T_MAX].map((t) => temperature(middle, t));
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeLessThan(peaks[i - 1]);
  });

  it("never runs below zero or above the start", () => {
    for (const t of [0.0005, 0.03, T_MAX]) {
      for (const value of sampleRod(t, 200)) {
        expect(value).toBeGreaterThanOrEqual(-1e-6);
        expect(value).toBeLessThanOrEqual(1 + 1e-6);
      }
    }
  });
});

describe("heatInA", () => {
  it("is nothing at the start and grows as heat arrives", () => {
    expect(heatInA(0)).toBe(0);
    const later = [0.01, 0.03, 0.06, T_MAX].map(heatInA);
    for (let i = 1; i < later.length; i++) expect(later[i]).toBeGreaterThan(later[i - 1]);
  });
});

describe("rodState", () => {
  it("reads concentrated, then spreading, then reached, as the slider moves right", () => {
    const states = Array.from({ length: 101 }, (_, p) => rodState(timeAt(p)));
    expect(states[0]).toBe("concentrated");
    expect(states[100]).toBe("reached");
    expect(states).toContain("spreading");
    // Each state is one run of the slider: no flicker back and forth.
    const runs = states.filter((state, i) => i === 0 || state !== states[i - 1]);
    expect(runs).toEqual(["concentrated", "spreading", "reached"]);
  });
});

describe("shade", () => {
  it("paints the hot start fully and nothing where there is no heat", () => {
    expect(shade(1)).toBe(1);
    expect(shade(0)).toBe(0);
  });

  it("keeps the heat that reaches A visible at the slider's end", () => {
    expect(shade(heatInA(T_MAX))).toBeGreaterThan(0.2);
  });

  it("still paints the start warmer than A at the slider's end", () => {
    const middle = (HOT[0] + HOT[1]) / 2;
    expect(shade(temperature(middle, T_MAX)) - shade(heatInA(T_MAX))).toBeGreaterThan(0.1);
  });
});

describe("rodOutline", () => {
  const box = { width: 300, height: 32, inset: 4, phase: 0.7 };
  const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

  it("is a plain pill where the rod is cold", () => {
    const d = rodOutline({ ...box, amplitude: () => 0 });
    // Every edge point sits on the top (4) or bottom (36) line, bar the arcs' radii.
    const ys = [...d.matchAll(/L[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(new Set(ys)).toEqual(new Set([4, 36]));
  });

  it("stays within the room left for it and never draws NaN", () => {
    const d = rodOutline({ ...box, amplitude: () => RIPPLE_MAX });
    for (const n of numbers(d)) expect(Number.isFinite(n)).toBe(true);
    const ys = [...d.matchAll(/L[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(box.inset - RIPPLE_MAX - 1e-9);
    expect(Math.max(...ys)).toBeLessThanOrEqual(box.inset + box.height + RIPPLE_MAX + 1e-9);
  });

  it("ripples only where the rod is warm", () => {
    const warmUntil = 120;
    const d = rodOutline({ ...box, amplitude: (x) => (x < warmUntil ? RIPPLE_MAX : 0) });
    const points = [...d.matchAll(/L([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const cold = points.filter(([x]) => x >= warmUntil);
    for (const [, y] of cold) expect([4, 36]).toContain(y);
    expect(points.some(([x, y]) => x < warmUntil && y !== 4 && y !== 36)).toBe(true);
  });
});

describe("rippleProfile", () => {
  it("swells in across a hot edge instead of jumping", () => {
    const cells = Array.from({ length: 100 }, (_, i) => (i >= 40 && i < 60 ? 1 : 0));
    const profile = rippleProfile(cells, 5);
    const jumps = profile.slice(1).map((value, i) => Math.abs(value - profile[i]));
    expect(Math.max(...jumps)).toBeLessThan(RIPPLE_MAX / 5);
    expect(profile[50]).toBeCloseTo(RIPPLE_MAX, 1);
    expect(profile[10]).toBe(0);
  });
});

describe("rippleAt", () => {
  it("is tallest at the hot start and nothing where the rod is cold", () => {
    expect(rippleAt(1)).toBe(RIPPLE_MAX);
    expect(rippleAt(0)).toBe(0);
  });
});

describe("REACHED_POSITION", () => {
  it("is the first slider position at which the heat has reached A", () => {
    expect(rodState(timeAt(REACHED_POSITION))).toBe("reached");
    expect(rodState(timeAt(REACHED_POSITION - 1))).not.toBe("reached");
  });
});
