import { describe, expect, it } from "vitest";

import { advanceIndex } from "@/hooks/use-swipe-slider";

// Slides are indexed 1..count, with clones at 0 and count+1.
const COUNT = 3;

describe("advanceIndex", () => {
  describe("while animating", () => {
    it("steps through the real slides", () => {
      expect(advanceIndex(1, 1, COUNT, true)).toBe(2);
      expect(advanceIndex(3, -1, COUNT, true)).toBe(2);
    });

    it("lands on a clone at each edge, for onTransitionEnd to normalise", () => {
      expect(advanceIndex(COUNT, 1, COUNT, true)).toBe(COUNT + 1);
      expect(advanceIndex(1, -1, COUNT, true)).toBe(0);
    });
  });

  describe("with reduced motion", () => {
    it("steps through the real slides unchanged", () => {
      expect(advanceIndex(1, 1, COUNT, false)).toBe(2);
      expect(advanceIndex(3, -1, COUNT, false)).toBe(2);
    });

    // There is no transition, so no transitionend fires; landing on a clone
    // would strand the slider there.
    it("skips the clones and wraps straight onto the real slide", () => {
      expect(advanceIndex(COUNT, 1, COUNT, false)).toBe(1);
      expect(advanceIndex(1, -1, COUNT, false)).toBe(COUNT);
    });

    it("wraps repeatedly in both directions without drifting", () => {
      let index = 1;
      for (let i = 0; i < COUNT * 3; i += 1) {
        index = advanceIndex(index, 1, COUNT, false);
        expect(index).toBeGreaterThanOrEqual(1);
        expect(index).toBeLessThanOrEqual(COUNT);
      }
      expect(index).toBe(1);

      for (let i = 0; i < COUNT * 3; i += 1) {
        index = advanceIndex(index, -1, COUNT, false);
        expect(index).toBeGreaterThanOrEqual(1);
        expect(index).toBeLessThanOrEqual(COUNT);
      }
      expect(index).toBe(1);
    });

    it("wraps a single slide onto itself", () => {
      expect(advanceIndex(1, 1, 1, false)).toBe(1);
      expect(advanceIndex(1, -1, 1, false)).toBe(1);
    });

    // The hook guards this case too, but the function must not invent an index.
    it("leaves an empty slider alone", () => {
      expect(advanceIndex(1, 1, 0, false)).toBe(2);
    });
  });
});
