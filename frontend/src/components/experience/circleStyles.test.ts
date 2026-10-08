import { describe, expect, it } from "vitest";

import { sidebarMarks } from "./circleStyles";

describe("sidebarMarks", () => {
  it("leaves every circle as it is while nothing is chosen", () => {
    expect(sidebarMarks(1, null, null)).toEqual({ marked: false, receded: false });
  });

  it("marks a chosen role and lets the others recede", () => {
    expect(sidebarMarks(1, 1, null)).toEqual({ marked: true, receded: false });
    expect(sidebarMarks(2, 1, null)).toEqual({ marked: false, receded: true });
  });

  it("marks the roles a chosen skill used and lets the others recede", () => {
    const used = new Set([2, 3]);
    expect(sidebarMarks(2, null, used)).toEqual({ marked: true, receded: false });
    expect(sidebarMarks(4, null, used)).toEqual({ marked: false, receded: true });
  });

  it("marks both the chosen role and the skill's roles when both are chosen", () => {
    const used = new Set([2]);
    expect(sidebarMarks(1, 1, used).marked).toBe(true);
    expect(sidebarMarks(2, 1, used).marked).toBe(true);
    expect(sidebarMarks(3, 1, used).receded).toBe(true);
  });
});
