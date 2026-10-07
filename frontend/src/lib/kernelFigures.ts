/**
 * Geometry for the two schematic figures in the heat-kernel section. Neither
 * computes a Jacobi heat kernel: they show ideas — influence spreading softly
 * from a pulse, and two bounds of one shape — so every number here is a
 * drawing choice, never a value of the kernel.
 */

// --- The map of influence -------------------------------------------------

/** Where its slider starts: the influence has visibly spread, not yet far. */
export const INFLUENCE_START = 0.35;

/** How far the influence has spread, in drawing px, for a slider at s ∈ [0, 1]. */
export const spreadAt = (s: number) => 14 + 110 * s;

/**
 * How strongly the pulse's own spot is painted as the influence spreads:
 * full just after the pulse, fading as the same heat covers more room. The
 * fade is slow on purpose — about 0.6 at the slider's start and still 0.4 at
 * its end — so the heat stays visible on the white cone throughout.
 */
export const strengthAt = (spread: number) => Math.min(1, (14 / spread) ** 0.4);

/**
 * The heat as one disc around the pulse, as the rod's hot part is one piece:
 * filled darkest at the pulse and paling outward, but still visible at its
 * edge, so the edge can be seen to move. Its radius follows the spread but
 * grows slowly enough that the rim stays inside the cone, where it can be
 * seen: about 18 just after the pulse, about 113 at the slider's end, which
 * reaches the "inside" observation point three quarters of the way along.
 */
export const heatRadius = (spread: number) => 6 + 0.86 * spread;

/** The disc's fill from centre (0) to rim (1): never quite gone at the rim. */
export const discStops = (strength: number, count = 10) =>
  Array.from({ length: count }, (_, i) => {
    const offset = i / (count - 1);
    return { offset, opacity: strength * (0.25 + 0.75 * Math.exp(-3 * offset * offset)) };
  });

/**
 * The waves that make the rim irregular: [crests round the rim, speed in
 * radians a second, phase, share of the height]. Unequal crest counts and
 * unrelated speeds, so the edge never repeats or settles into a pattern.
 */
const RIM_WAVES: readonly (readonly [number, number, number, number])[] = [
  [3, 0.7, 1.0, 0.55],
  [5, -1.1, 2.1, 0.35],
  [7, 1.5, 0.4, 0.25],
  [11, -1.9, 2.9, 0.15],
  [17, 2.6, 1.7, 0.08],
];

/** How far the rim strays, in drawing units: a little more on a bigger disc. */
export const rimAmplitude = (radius: number) => 2 + 0.06 * radius;

/**
 * The disc's outline around (cx, cy): roughly round, with a gently irregular
 * edge whose uneven bumps drift and change shape as time runs.
 */
export const wavyRim = (cx: number, cy: number, radius: number, time: number, points = 240) => {
  const amplitude = rimAmplitude(radius);
  const coords = Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * 2 * Math.PI;
    const wobble = RIM_WAVES.reduce(
      (sum, [crests, speed, phase, share]) =>
        sum + share * Math.sin(crests * angle + speed * time + phase),
      0,
    );
    const r = radius + amplitude * wobble;
    return `${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${coords.join("L")}Z`;
};

/** The shares of the height add up to this, so the rim never strays further. */
export const RIM_REACH = RIM_WAVES.reduce((sum, [, , , share]) => sum + share, 0);

// --- Sharp bounds -----------------------------------------------------------

/** Where its slider starts: the bounds tall enough to read their shape. */
export const BOUNDS_START = 0.3;

/** The shared expression both bounds are built from, at distance d and time t. */
export const shape = (distance: number, time: number) =>
  Math.exp(-(distance * distance) / (4 * time)) / Math.sqrt(time);

/** The two constants. Far apart on purpose: sharp is not a narrow band. */
export const LOWER = 1;
export const UPPER = 2.6;

/** The slider's time range: long enough for the bounds to change shape visibly. */
export const T_MIN = 0.03;
export const T_MAX = 0.16;
export const timeAt = (s: number) => T_MIN + (T_MAX - T_MIN) * s;

/** The tallest the upper bound ever gets, so the axis never rescales. */
export const Y_MAX = UPPER * shape(0, T_MIN);

type Plot = { left: number; right: number; top: number; bottom: number };

/** An SVG polyline of `constant × shape(·, t)` across the plot, distance 0–1. */
export const boundPoints = (constant: number, time: number, plot: Plot, samples = 80) =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const d = i / samples;
    const x = plot.left + d * (plot.right - plot.left);
    const y = plot.bottom - ((constant * shape(d, time)) / Y_MAX) * (plot.bottom - plot.top);
    return [x, y] as const;
  });

export const toPath = (points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/** The region between the bounds: along the upper, back along the lower. */
export const bandPath = (time: number, plot: Plot) => {
  const upper = boundPoints(UPPER, time, plot);
  const lower = boundPoints(LOWER, time, plot).reverse();
  return `${toPath(upper)}${toPath(lower).replace(/^M/, "L")}Z`;
};
