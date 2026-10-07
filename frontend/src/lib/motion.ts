/**
 * The kit's motion in code: its curves, for the Web Animations API and inline
 * transitions, and the same curves as functions, for motion driven frame by
 * frame. The CSS side has them as Tailwind's `ease-brand`.
 */

/** The entrance curve, a strong ease-out: things arrive and settle. */
export const EASE_BRAND = "cubic-bezier(0.22, 1, 0.36, 1)";
/** The exit curve: things leave quickly, without a settle. */
export const EASE_EXIT = "cubic-bezier(0.4, 0, 1, 1)";
/** A symmetric ease, for something that travels from one place to another. */
export const EASE_TRAVEL = "cubic-bezier(0.45, 0, 0.55, 1)";

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Ease-out, in the spirit of EASE_BRAND, for progress driven frame by frame. */
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
