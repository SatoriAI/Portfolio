import { describe, expect, it } from "vitest";

import { entrance } from "./entrance";

const below = { measured: true, initiallyVisible: false, reducedMotion: false };

describe("entrance", () => {
  it("shows what the build wrote, without transitions, until measured", () => {
    expect(entrance({ ...below, measured: false, revealed: false })).toEqual({
      animated: false,
      shown: true,
      entering: false,
    });
  });

  it("hides what is measured below the fold at once: no transition yet", () => {
    // With a transition here, the HTML's content would fade out on takeover.
    expect(entrance({ ...below, revealed: false })).toEqual({
      animated: true,
      shown: false,
      entering: false,
    });
  });

  it("turns the transition on with the reveal, so the entrance plays", () => {
    expect(entrance({ ...below, revealed: true })).toEqual({
      animated: true,
      shown: true,
      entering: true,
    });
  });

  it("never enters what was on screen when measured, or under reduced motion", () => {
    for (const state of [
      { ...below, initiallyVisible: true, revealed: true },
      { ...below, reducedMotion: true, revealed: true },
    ]) {
      expect(entrance(state)).toEqual({ animated: false, shown: true, entering: false });
    }
  });
});
