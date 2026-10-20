import { describe, expect, it } from "vitest";

import { DELAY_FROM, DELAY_TO, delayBand, PAD } from "./grokkingThumbnail";

describe("delayBand", () => {
  it("runs from the step training is known to the step new examples pass 50%", () => {
    expect([DELAY_FROM, DELAY_TO]).toEqual([1000, 3000]);
    // The clock piece's figure at 1440.
    const band = delayBand(544.65625)!;
    expect(band.x).toBeCloseTo(36 + 500.65625 / 6);
    expect(band.width).toBeCloseTo(500.65625 / 3);
    expect([band.y, band.height]).toEqual([10, 156]);
  });

  it("is never a rectangle of negative width", () => {
    for (let width = 0; width <= 600; width += 0.5) {
      const band = delayBand(width);
      if (band) expect(band.width).toBeGreaterThanOrEqual(0);
    }
  });

  it("is not drawn in a box no wider than its padding", () => {
    // 22 px: the clock piece's figure in a 120 px window, where Chrome logged width -7.33.
    expect(delayBand(22)).toBeNull();
    expect(delayBand(PAD.left + PAD.right)).toBeNull();
    expect(delayBand(PAD.left + PAD.right + 1)).not.toBeNull();
  });
});
