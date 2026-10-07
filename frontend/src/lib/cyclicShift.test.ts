import { describe, expect, it } from "vitest";

import { modePath, modeRadius, ringPoint } from "./cyclicShift";

const ring = { center: 160, radius: 112, amplitude: 22 };

describe("ringPoint", () => {
  it("puts position 0 at twelve o'clock and a quarter of the way at three", () => {
    const top = ringPoint(160, 100, 0, 12);
    expect(top.x).toBeCloseTo(160);
    expect(top.y).toBeCloseTo(60);
    const three = ringPoint(160, 100, 3, 12);
    expect(three.x).toBeCloseTo(260);
    expect(three.y).toBeCloseTo(160);
  });
});

describe("modeRadius", () => {
  it("turns rigidly: shifting by a moves every value a places along", () => {
    for (const [k, a] of [
      [3, 5],
      [8, 40],
      [56, 112],
    ]) {
      for (const x of [0, 1, 17.5, 90]) {
        expect(modeRadius(ring, 113, k, a, x + a)).toBeCloseTo(modeRadius(ring, 113, k, 0, x));
      }
    }
  });

  it("returns to itself after a full turn of the group", () => {
    expect(modeRadius(ring, 113, 3, 113, 10)).toBeCloseTo(modeRadius(ring, 113, 3, 0, 10));
  });
});

describe("modePath", () => {
  it("is one closed polyline", () => {
    const d = modePath(ring, 113, 3, 0, 12);
    expect(d.replace(/[\d. -]/g, "")).toBe(`M${"L".repeat(12)}Z`);
  });
});
