import { describe, expect, it } from "vitest";

import {
  drift,
  EDGES,
  layoutFor,
  NARROW,
  NARROW_BELOW,
  trim,
  WIDE,
  wrapLabel,
} from "./researchMap";

describe("drift", () => {
  it("never wanders further than asked", () => {
    for (let time = 0; time < 30; time += 0.37) {
      const { x, y } = drift(time, 1.1, 5);
      expect(Math.abs(x)).toBeLessThanOrEqual(5);
      expect(Math.abs(y)).toBeLessThanOrEqual(5);
    }
  });
});

describe("trim", () => {
  it("runs from rim to rim", () => {
    const { start, end } = trim({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 20);
    expect(start).toEqual({ x: 10, y: 0 });
    expect(end).toEqual({ x: 80, y: 0 });
  });
});

describe("layouts", () => {
  it("give every node a label side", () => {
    for (const layout of [WIDE, NARROW]) {
      expect(Object.keys(layout.labels).sort()).toEqual(Object.keys(layout.at).sort());
    }
  });

  it("join topics only through a field, never directly", () => {
    const topics = ["kernels", "reasoning", "quantum"];
    for (const [a, b] of EDGES) expect(topics.includes(a) && topics.includes(b)).toBe(false);
  });

  it("put harmonic analysis at the centre of the wide graph, joining two topics", () => {
    expect(WIDE.at.harmonic.x).toBe(0.5);
    const joins = EDGES.filter((edge) => edge.includes("harmonic")).map((edge) =>
      edge.find((key) => key !== "harmonic"),
    );
    expect(joins.sort()).toEqual(["kernels", "reasoning"]);
  });
});

describe("wrapLabel", () => {
  it("wraps at word boundaries within the limit", () => {
    expect(wrapLabel("Analiza funkcjonalna i teoria operatorów", 22)).toEqual([
      "Analiza funkcjonalna i",
      "teoria operatorów",
    ]);
    expect(wrapLabel("Jądra ciepła", 22)).toEqual(["Jądra ciepła"]);
  });
});

describe("layoutFor", () => {
  it("switches to the tall layout on narrow screens", () => {
    expect(layoutFor(NARROW_BELOW - 1)).toBe(NARROW);
    expect(layoutFor(NARROW_BELOW)).toBe(WIDE);
  });

  it("keeps every node inside the drawing", () => {
    for (const layout of [WIDE, NARROW]) {
      for (const { x, y } of Object.values(layout.at)) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(1);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(1);
      }
    }
  });
});
