/**
 * Geometry for drawing the cyclic group ℤₙ as n points on a circle, with one
 * Fourier mode of the group drawn over them as the closed curve
 *
 *   r(x) = R + A·cos(2πk(x − a)/n),
 *
 * where a is the shift. Replacing a by a + 1 is the group acting on itself,
 * and the curve turns rigidly: a shift of the argument is only a change of
 * phase, e^(2πik(x+a)/n) = e^(2πika/n) · e^(2πikx/n).
 */

export type Ring = {
  /** Centre of the circle, in drawing units, on both axes. */
  center: number;
  radius: number;
  /** Height of the mode above and below the circle. */
  amplitude: number;
};

/**
 * A drawing coordinate to a hundredth. Unrounded, one of the ring's points
 * came out as 183.36478658202674 at build time (Node) and 183.3647865820267
 * in Chrome, which React's development build reports as a hydration mismatch
 * (production keeps the build's value, a ten-trillionth off). The other
 * figures' coordinates agree in both engines, or React would report the
 * next mismatch once this one is gone.
 */
const hundredth = (value: number) => Math.round(value * 100) / 100;

/** Where position `x` of `n` stands, clockwise from twelve o'clock. */
export const ringPoint = (center: number, radius: number, x: number, n: number) => {
  const angle = (2 * Math.PI * x) / n;
  return {
    x: hundredth(center + radius * Math.sin(angle)),
    y: hundredth(center - radius * Math.cos(angle)),
  };
};

/** The mode's distance from the centre at position `x` (a real number). */
export const modeRadius = (ring: Ring, n: number, k: number, shift: number, x: number) =>
  ring.radius + ring.amplitude * Math.cos((2 * Math.PI * k * (x - shift)) / n);

/** The mode as a closed SVG path, sampled `samples` times round the circle. */
export const modePath = (ring: Ring, n: number, k: number, shift: number, samples = 360) =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const x = (i / samples) * n;
    const { x: px, y: py } = ringPoint(ring.center, modeRadius(ring, n, k, shift, x), x, n);
    return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(" ") + " Z";
