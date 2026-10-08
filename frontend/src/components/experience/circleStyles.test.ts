import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

import {
  circleControl,
  recededFilter,
  SIDEBAR_TRANSITION,
  sidebarCircleState,
  sidebarMarks,
} from "./circleStyles";

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

describe("a sidebar circle's classes", () => {
  // As RoleSidebar composes them; tailwind-merge drops whatever a later class
  // overrides, which is how a fade can silently stop working.
  const sidebar = (marks: { marked: boolean; receded: boolean }) =>
    cn(circleControl, sidebarCircleState(marks), SIDEBAR_TRANSITION).split(" ");

  it("keeps the receding filter and fades it, while opacity stays instant", () => {
    const classes = sidebar({ marked: false, receded: true });
    expect(classes).toContain("[filter:grayscale(1)_opacity(0.45)]");
    expect(classes).toContain("motion-safe:transition-[transform,filter]");
    expect(classes).not.toContain("motion-safe:transition-[transform,opacity]");
  });

  it("brings a receded circle back in full under keyboard focus", () => {
    expect(sidebar({ marked: false, receded: true })).toContain("focus-visible:[filter:none]");
  });

  it("rings a marked circle", () => {
    expect(sidebar({ marked: true, receded: false })).toContain("outline-lavender-deep");
  });
});

describe("recededFilter", () => {
  it("runs from plain to the sidebar's receded look", () => {
    expect(recededFilter(0)).toBe("");
    expect(recededFilter(1)).toBe(`grayscale(1) opacity(${1 - 0.55})`);
  });
});
