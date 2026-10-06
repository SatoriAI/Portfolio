/**
 * One point of heat spreading over a drawing, as keyframes for a round glow.
 *
 * The glow follows the heat kernel of the plane, u(x, t) = e^(−|x|²/4t) / 4πt:
 * its width grows as √t and its peak falls as 1/t. Time runs from a moment
 * after the source is placed to the end, evenly with the clock, so the heat
 * spreads fast at first and slows, as it does. One departure, as in the home
 * page's field: the peak falls as a softer power of 1/t, since at the true
 * rate the glow would be gone before it had visibly spread. It ends at rest,
 * nothing left, so nothing runs after it.
 */

/** Where time starts, as a fraction of the end: the source's first moment. */
const START = 1 / 25;
/** The softened fall of the peak: 1/t to this power. */
const FALL = 0.4;
/** How many keyframes sample the curve; the browser joins them in straight lines. */
const SAMPLES = 12;

export type HeatKeyframe = { offset: number; transform: string; opacity: number };

export function heatPulseKeyframes(peak: number): HeatKeyframe[] {
  return Array.from({ length: SAMPLES + 1 }, (_, step) => {
    const offset = step / SAMPLES;
    const t = START + (1 - START) * offset;
    const opacity = step === SAMPLES ? 0 : peak * (START / t) ** FALL;
    return { offset, transform: `scale(${Math.sqrt(t).toFixed(4)})`, opacity };
  });
}
