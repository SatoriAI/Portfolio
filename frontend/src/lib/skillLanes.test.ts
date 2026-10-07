import { describe, expect, it } from "vitest";

import { claimsEarlier, laneSegments } from "./skillLanes";

describe("laneSegments", () => {
  it("merges roles that overlap and keeps a gap between roles that do not", () => {
    expect(
      laneSegments([
        { startMonth: 28, endMonth: 40, current: false },
        { startMonth: 0, endMonth: 43, current: false },
        { startMonth: 55, endMonth: 71, current: false },
      ]),
    ).toEqual([
      { startMonth: 0, endMonth: 43, current: false },
      { startMonth: 55, endMonth: 71, current: false },
    ]);
  });

  it("keeps a stretch running when the role that ends last is still running", () => {
    expect(
      laneSegments([
        { startMonth: 0, endMonth: 43, current: false },
        { startMonth: 35, endMonth: 84, current: true },
      ]),
    ).toEqual([{ startMonth: 0, endMonth: 84, current: true }]);
  });

  it("joins roles that meet end to start", () => {
    expect(
      laneSegments([
        { startMonth: 0, endMonth: 10, current: false },
        { startMonth: 10, endMonth: 20, current: false },
      ]),
    ).toEqual([{ startMonth: 0, endMonth: 20, current: false }]);
  });
});

describe("claimsEarlier", () => {
  const segments = [{ startMonth: 0, endMonth: 84, current: true }];

  it("says so when the claimed years reach back past the first drawn month", () => {
    expect(claimsEarlier(segments, 10, 84)).toBe(true);
  });

  it("does not when the roles already cover the claim", () => {
    expect(claimsEarlier(segments, 5, 84)).toBe(false);
  });

  it("does not for a level that is not a count, or a skill without a lane", () => {
    expect(claimsEarlier(segments, null, 84)).toBe(false);
    expect(claimsEarlier([], 10, 84)).toBe(false);
  });
});
