import { describe, expect, it } from "vitest";

import { heatPulseKeyframes } from "./heatPulse";

describe("heatPulseKeyframes", () => {
  const frames = heatPulseKeyframes(0.8);
  const scales = frames.map((frame) => Number(/scale\(([\d.]+)\)/.exec(frame.transform)?.[1]));

  it("starts small and at the peak, and ends at full width with nothing left", () => {
    expect(frames[0]).toMatchObject({ offset: 0, opacity: 0.8 });
    expect(scales[0]).toBeCloseTo(0.2, 3);
    expect(frames.at(-1)).toMatchObject({ offset: 1, opacity: 0, transform: "scale(1.0000)" });
  });

  it("widens and fades all the way", () => {
    for (let step = 1; step < frames.length; step += 1) {
      expect(scales[step]).toBeGreaterThan(scales[step - 1]);
      expect(frames[step].opacity).toBeLessThan(frames[step - 1].opacity);
    }
  });

  it("spreads fastest at first, as heat does", () => {
    expect(scales[1] - scales[0]).toBeGreaterThan(scales.at(-1)! - scales.at(-2)!);
  });
});
