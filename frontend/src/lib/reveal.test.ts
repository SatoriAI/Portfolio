import { describe, expect, it } from "vitest";

import { revealFromCircle } from "./reveal";

const panel = { left: 100, top: 100, width: 300, height: 400 };

describe("revealFromCircle", () => {
  it("starts as the pressed circle, centred on it", () => {
    const circle = { left: 120, top: 130, width: 56, height: 56 };
    expect(revealFromCircle(panel, circle).from).toBe("circle(28px at 48px 58px)");
  });

  it("ends past the corner farthest from the circle, shadow included", () => {
    // From (48, 58) the farthest corner is (300, 400): hypot(252, 342) = 424.8…
    const circle = { left: 120, top: 130, width: 56, height: 56 };
    const radius = Math.hypot(252, 342) + 48;
    expect(revealFromCircle(panel, circle).to).toBe(`circle(${radius}px at 48px 58px)`);
  });

  it("grows from a circle outside the panel", () => {
    const circle = { left: 0, top: 0, width: 40, height: 40 };
    expect(revealFromCircle(panel, circle).from).toBe("circle(20px at -80px -80px)");
  });
});
