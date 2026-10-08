import { describe, expect, it } from "vitest";

import { laneSegments, skillReach } from "./skillLanes";

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

describe("skillReach", () => {
  // An axis from November 2020 to October 2026: the month after now is 72.
  const months = 72;
  const fromNokia = [{ startMonth: 0, endMonth: 72, current: true }];

  it("counts from the first role when there is no start year", () => {
    expect(skillReach(fromNokia, null, months)).toEqual({
      leadIn: null,
      beforeAxis: false,
      years: 5,
    });
  });

  it("leads in dashed from a start year before the axis, cut at its edge", () => {
    // January 2016 is 58 months before November 2020.
    expect(skillReach(fromNokia, -58, months)).toEqual({
      leadIn: { startMonth: 0, endMonth: 0 },
      beforeAxis: true,
      years: 10,
    });
  });

  it("leads in from a start year on the axis up to the first role", () => {
    const fromPwc = [{ startMonth: 61, endMonth: 72, current: true }];
    expect(skillReach(fromPwc, 26, months)).toEqual({
      leadIn: { startMonth: 26, endMonth: 61 },
      beforeAxis: false,
      years: 3,
    });
  });

  it("ignores a start year after the first role", () => {
    expect(skillReach(fromNokia, 10, months).leadIn).toBeNull();
  });

  it("runs a start year with no role behind it on to now", () => {
    expect(skillReach([], 26, months)).toEqual({
      leadIn: { startMonth: 26, endMonth: 72 },
      beforeAxis: false,
      years: 3,
    });
  });

  it("places nothing without a role or a start year", () => {
    expect(skillReach([], null, months).years).toBeNull();
  });

  it("says under a year as zero", () => {
    expect(skillReach([{ startMonth: 61, endMonth: 72, current: true }], null, months).years).toBe(
      0,
    );
  });
});
