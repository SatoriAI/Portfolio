import { describe, expect, it } from "vitest";

import { edgeOffset } from "./edgeEntrance";

const circle = (left: number, top: number, size = 56) => ({
  left,
  top,
  right: left + size,
  bottom: top + size,
});

describe("edgeOffset", () => {
  it("starts a circle near the left edge just past it", () => {
    expect(edgeOffset(circle(100, 300), 1280, 800)).toEqual({ x: -180, y: 0 });
  });

  it("starts a circle near the right edge just past it", () => {
    expect(edgeOffset(circle(1100, 300), 1280, 800)).toEqual({ x: 204, y: 0 });
  });

  it("starts a low circle from the side, never from below", () => {
    expect(edgeOffset(circle(600, 700), 1280, 800)).toEqual({ x: -680, y: 0 });
  });

  it("starts a high circle from the side, never from the top", () => {
    expect(edgeOffset(circle(700, 80), 1280, 800)).toEqual({ x: 604, y: 0 });
  });

  it("leaves a circle off screen where it is", () => {
    expect(edgeOffset(circle(600, 900), 1280, 800)).toBeNull();
  });
});
