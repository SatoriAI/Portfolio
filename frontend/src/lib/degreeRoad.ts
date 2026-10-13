import { clamp01, EASE_BRAND } from "@/lib/motion";

/**
 * The degrees' road, as numbers: where each stop sits on the road and in the
 * compact row, the road's path through the stops, and every moving part's
 * place at any moment of the winding between the two (`roadFrame`), so the
 * component only has to turn frames into styles.
 *
 * From md the road runs across the column: a soft wave through the stops,
 * the earliest on the left, every other one a little lower, trailing off to
 * the column's right edge. Choosing a degree winds it back: the road is
 * reeled in from its far end onto a coil round the first stop, the other
 * stops riding the thread in; the coil travels up to the row and unrolls
 * into it, each stop dropping into its place as the thread passes. Below md
 * the stops stand in a list and simply cross over to the row.
 *
 * All lengths are CSS pixels, measured from the stage's top left corner.
 */

export type Point = { x: number; y: number };

export type RoadGeometry = {
  /** The stage's width: the content column. */
  width: number;
  /** Below md: a list, and a plain cross-over instead of the winding. */
  phone: boolean;
  /** Each stop's centre on the road, and in the compact row. */
  rest: Point[];
  compact: Point[];
  /** A stop's disc is DISC px across, drawn at these scales. */
  restScale: number;
  compactScale: number;
  /** The stage's height with the road out, and the card's top in the row. */
  height: number;
  cardTop: number;
  /** The road, as an SVG path, and its length. */
  path: string;
  length: number;
  /** How far along the road each stop sits. */
  arcs: number[];
  /** The road sampled evenly by length, for `pointAt`. */
  samples: Point[];
};

/**
 * The wave's crest and trough on the road, in px from the stage's top: the
 * crest's disc just clears the top, so all three stops and their names fit
 * the first screen at 1024x768.
 */
const HIGH = 68;
const LOW = 116;

/** A stop's disc, unscaled, in px. */
export const DISC = 120;

/** The kit's ease, and an even in-and-out for the travelling parts. */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (progress: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // Newton's method on x, then bisection should it stall.
    let t = progress;
    for (let i = 0; i < 8; i++) {
      const slope = dx(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= (x(t) - progress) / slope;
    }
    if (t < 0 || t > 1 || Math.abs(x(t) - progress) > 1e-4) {
      let low = 0;
      let high = 1;
      t = progress;
      for (let i = 0; i < 30; i++) {
        if (x(t) < progress) low = t;
        else high = t;
        t = (low + high) / 2;
      }
    }
    return y(t);
  };
};
/** The kit's ease, read from EASE_BRAND so the two can never drift apart. */
const easeBrand = cubicBezier(
  ...((EASE_BRAND.match(/[\d.]+/g) ?? []).map(Number) as [number, number, number, number]),
);
const easeInOut = cubicBezier(0.65, 0, 0.35, 1);

/** Progress through the window [from, to] of the whole, 0 before and 1 after. */
const within = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

type Cubic = [Point, Point, Point, Point];

const cubicAt = ([p0, p1, p2, p3]: Cubic, t: number): Point => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

/** A straight piece as a cubic, so the road is one kind of curve throughout. */
const line = (from: Point, to: Point): Cubic => [
  from,
  { x: lerp(from.x, to.x, 1 / 3), y: lerp(from.y, to.y, 1 / 3) },
  { x: lerp(from.x, to.x, 2 / 3), y: lerp(from.y, to.y, 2 / 3) },
  to,
];

const STEPS_PER_PIECE = 160;
const SAMPLE_EVERY = 2;

/**
 * The road at any width. Three degrees, three stops; more would carry on the
 * wave (and the row) at the same spacing.
 */
export const roadGeometry = (width: number, phone: boolean, count = 3): RoadGeometry => {
  const stops = Math.max(1, count);
  let rest: Point[];
  let compact: Point[];
  let pieces: Cubic[];
  let restScale: number;
  let compactScale: number;
  let height: number;
  let cardTop: number;
  if (!phone) {
    // Across the column: the first stop's name centred under it keeps to the
    // column (the longest, "Studia licencjackie" in the card title's size, is
    // about 205px), and the last leaves room for the road to trail off.
    const first = 112;
    const last = Math.max(first + 1, Math.round(width - 250));
    const step = stops > 1 ? (last - first) / (stops - 1) : 0;
    rest = Array.from({ length: stops }, (_, i) => ({
      x: Math.round(first + i * step),
      y: i % 2 ? LOW : HIGH,
    }));
    // The first disc in the row leaves room for its years, centred under it.
    compact = Array.from({ length: stops }, (_, i) => ({ x: 36 + i * 112, y: 42 }));
    restScale = 1;
    compactScale = 56 / DISC;
    height = LOW + DISC / 2 + 20 + 96;
    cardTop = 116;
    const pull = step * 0.5;
    pieces = rest.slice(1).map((to, i): Cubic => {
      const from = rest[i];
      return [from, { x: from.x + pull, y: from.y }, { x: to.x - pull, y: to.y }, to];
    });
    const end = rest[stops - 1];
    pieces.push([
      end,
      { x: end.x + 110, y: end.y },
      { x: width - 110, y: end.y + 40 },
      { x: width, y: end.y + 40 },
    ]);
  } else {
    rest = Array.from({ length: stops }, (_, i) => ({ x: 30, y: 36 + i * 104 }));
    compact = Array.from({ length: stops }, (_, i) => ({ x: 34 + i * 84, y: 28 }));
    restScale = 60 / DISC;
    compactScale = 48 / DISC;
    height = rest[stops - 1].y + 70;
    // Room for the chosen degree's name on a line of its own under the row.
    cardTop = 128;
    pieces = rest.slice(1).map((to, i) => line(rest[i], to));
    const end = rest[stops - 1];
    pieces.push(line(end, { x: end.x, y: end.y + 56 }));
  }

  // Walk the road finely, then keep a point every SAMPLE_EVERY px of length.
  const arcs: number[] = [0];
  const fine: { at: number; point: Point }[] = [{ at: 0, point: pieces[0][0] }];
  let length = 0;
  pieces.forEach((piece, index) => {
    let previous = piece[0];
    for (let step = 1; step <= STEPS_PER_PIECE; step++) {
      const point = cubicAt(piece, step / STEPS_PER_PIECE);
      length += Math.hypot(point.x - previous.x, point.y - previous.y);
      fine.push({ at: length, point });
      previous = point;
    }
    if (index < stops - 1) arcs.push(length);
  });
  const samples: Point[] = [];
  let cursor = 0;
  for (let at = 0; at <= length; at += SAMPLE_EVERY) {
    while (cursor < fine.length - 2 && fine[cursor + 1].at < at) cursor++;
    const a = fine[cursor];
    const b = fine[cursor + 1] ?? a;
    const k = b.at > a.at ? clamp01((at - a.at) / (b.at - a.at)) : 0;
    samples.push({ x: lerp(a.point.x, b.point.x, k), y: lerp(a.point.y, b.point.y, k) });
  }
  samples.push(fine[fine.length - 1].point);

  const f = (value: number) => Number(value.toFixed(2));
  const path =
    `M ${f(pieces[0][0].x)} ${f(pieces[0][0].y)} ` +
    pieces
      .map(
        ([, c1, c2, to]) => `C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(to.x)} ${f(to.y)}`,
      )
      .join(" ");

  return {
    width,
    phone,
    rest,
    compact,
    restScale,
    compactScale,
    height,
    cardTop,
    path,
    length,
    arcs,
    samples,
  };
};

/** The point `distance` px along the road, held at its ends. */
export const pointAt = (geometry: RoadGeometry, distance: number): Point => {
  const { samples, length } = geometry;
  const at = (clamp01(distance / length) * length) / SAMPLE_EVERY;
  const index = Math.min(samples.length - 2, Math.floor(at));
  const k = clamp01(at - index);
  const a = samples[index];
  const b = samples[index + 1] ?? a;
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
};

/** The coil's radius at its start, outside, and at its end, inside, in its own units. */
export const SPIRAL_OUTER = 50;
export const SPIRAL_INNER = 40;

/** The coil: three turns, from the top, outside in, centred on 0 0. */
export const spiralPath = (turns = 3, points = 150) =>
  Array.from({ length: points + 1 }, (_, i) => {
    const k = i / points;
    const angle = -Math.PI / 2 + k * turns * 2 * Math.PI;
    const radius = lerp(SPIRAL_OUTER, SPIRAL_INNER, k);
    return `${i ? "L" : "M"}${(radius * Math.cos(angle)).toFixed(2)} ${(radius * Math.sin(angle)).toFixed(2)}`;
  }).join("");

export type RoadFrame = {
  /** Each stop's centre and its disc's scale. */
  stops: { x: number; y: number; scale: number }[];
  /** How much of the road is still out, from its start; and how faint it is. */
  roadOut: number;
  roadOpacity: number;
  /** Where the road is cut off, across: the road always runs rightwards (or straight down). */
  roadCut: number;
  /** The coil: its centre, turn (degrees), scale, how much of it is wound, and whether it shows. */
  spool: { x: number; y: number; rotate: number; scale: number; wound: number; opacity: number };
  /** The dotted line through the row: where it starts, and how much of it is laid. */
  rowLine: { x: number; y: number; laid: number };
  /** Fades: the names on the road, the years in the row, the card. */
  names: number;
  years: number;
  card: number;
};

/**
 * Every part's place `t` of the way from the road (0) to the row (1). The
 * same frame serves both ways: unwinding is the winding played backwards.
 */
export const roadFrame = (geometry: RoadGeometry, t: number): RoadFrame => {
  const { rest, compact, restScale, compactScale, length, arcs, phone } = geometry;
  const last = rest.length - 1;
  const span = compact[last].x - compact[0].x;

  if (phone) {
    // The list crosses straight over to the row: no road to wind.
    const e = easeInOut(t);
    return {
      stops: rest.map((from, i) => ({
        x: lerp(from.x, compact[i].x, e),
        y: lerp(from.y, compact[i].y, e),
        scale: lerp(restScale, compactScale, e),
      })),
      roadOut: length,
      roadOpacity: 1 - within(t, 0, 0.5),
      roadCut: geometry.width,
      spool: { x: rest[0].x, y: rest[0].y, rotate: 0, scale: 1, wound: 0, opacity: 0 },
      rowLine: { x: compact[0].x, y: compact[0].y, laid: within(t, 0.3, 1) },
      names: 1 - within(t, 0, 0.4),
      years: within(t, 0.5, 1),
      card: within(t, 0.6, 1),
    };
  }

  // Wound in over the first half; the coil moves up to the row while the
  // last of it winds; and it unrolls into the row over the last stretch.
  const wind = easeInOut(within(t, 0, 0.5));
  const move = easeInOut(within(t, 0.42, 0.68));
  const unroll = easeBrand(within(t, 0.62, 1));
  const out = length * (1 - wind);
  const coil = { x: lerp(rest[0].x, compact[0].x, move), y: lerp(rest[0].y, compact[0].y, move) };
  const scale = lerp(restScale, compactScale, wind);
  // The stops keep this far apart along the thread as it comes in.
  const gap = 110 * scale;
  const stops = rest.map((_, i) => {
    const along =
      i === 0 ? 0 : Math.min(Math.max(0, Math.min(arcs[i], out - (last - i) * gap)), length);
    const on = pointAt(geometry, along);
    const unrolled = Math.min(compact[i].x - compact[0].x, unroll * span);
    return {
      x: on.x + coil.x - rest[0].x + unrolled,
      y: on.y + coil.y - rest[0].y,
      scale,
    };
  });
  return {
    stops,
    roadOut: out,
    // Gone once it is all wound in, so no dot of it is left at its start.
    roadOpacity: 1 - within(t, 0.42, 0.5),
    roadCut: pointAt(geometry, out).x,
    spool: {
      x: coil.x,
      y: coil.y,
      rotate: (wind - unroll) * 540,
      scale: (DISC * 0.5 * scale + 5) / SPIRAL_INNER,
      wound: wind * (1 - unroll),
      // Faded as it starts to unroll, so no tick of it is left over the row.
      opacity: wind > 0 ? 1 - within(t, 0.62, 0.74) : 0,
    },
    rowLine: { x: coil.x, y: compact[0].y, laid: unroll },
    names: 1 - within(t, 0, 0.16),
    years: within(t, 0.86, 1),
    // The card rises in while the row is still forming, so there is
    // something to read under the coil early.
    card: easeBrand(within(t, 0.55, 0.9)),
  };
};

/** How long the whole winding takes, and the unwinding, in ms. */
export const windMs = (phone: boolean) => (phone ? 280 : 1250);
export const unwindMs = (phone: boolean) => Math.round(windMs(phone) * 0.85);
