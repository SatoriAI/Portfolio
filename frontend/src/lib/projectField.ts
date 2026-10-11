import { heatAt, heatGradient, type HeatModel, type HeatSource } from "@/lib/heatKernel";

/**
 * The home page's projects as pucks on a heat field: where each one lives,
 * and how it moves. Pure, so the component (components/home/ProjectField)
 * only reads input and writes transforms. All lengths are CSS pixels and all
 * times seconds.
 */

export type Point = { x: number; y: number };

export type FieldLayout = {
  width: number;
  height: number;
  /** A puck's diameter. */
  size: number;
  /** Each puck's home, its centre. */
  slots: Point[];
  /** No simulation: a still grid on a still field. */
  still: boolean;
};

/** How far inside the field's sides and top a puck turns back, in pixels; every home is further in. */
export const EDGE = 12;

/** Above this many projects a phone shows a plain grid rather than a field to play in. */
export const PHONE_PLAY_LIMIT = 8;

type Scale = {
  /** The most pucks in a row. */
  perRow: number;
  size: number;
  rowHeight: number;
  /** Room above the first row and below the last. */
  pad: number;
  /** How far a home strays from its cell, at most, so the field reads as scattered, not ruled. */
  jitter: number;
  /** How far full rows lean alternately left and right, in cells. */
  lean: number;
  /** The widest a cell grows, so a few pucks on a wide field stay a group. */
  maxCell: number;
};

const scaleFor = (width: number): Scale =>
  width < 640
    ? { perRow: 3, size: 64, rowHeight: 112, pad: 16, jitter: 5, lean: 0.06, maxCell: Infinity }
    : width < 1024
      ? { perRow: 4, size: 80, rowHeight: 136, pad: 20, jitter: 10, lean: 0.12, maxCell: 200 }
      : { perRow: 6, size: 96, rowHeight: 148, pad: 20, jitter: 14, lean: 0.12, maxCell: 240 };

/**
 * Stable homes for `count` pucks across `width`. Rows hold as many as fit the
 * width's scale, filled evenly (seven on a desk are four and three, never six
 * and one); a short last row is centred; full rows lean alternately left and
 * right and every home strays a fixed amount, so the field looks scattered
 * but each puck comes back to the same place every time. The field grows by
 * a row as projects are added, so any number fits. `width` is the room
 * there is; the layout's own width is the field's.
 */
export const fieldLayout = (count: number, width: number, reducedMotion: boolean): FieldLayout => {
  const scale = scaleFor(width);
  const still = reducedMotion || (width < 640 && count > PHONE_PLAY_LIMIT);
  const rows = Math.max(1, Math.ceil(count / scale.perRow));
  const perRow = Math.max(1, Math.ceil(count / rows));
  const cell = Math.min(width / perRow, scale.maxCell);
  // The still grid is a block of its own, as wide as its cells, so it never
  // sits parked in a wide empty field; a field to play in keeps the width and
  // centres a narrower grid in it.
  const fieldWidth = still ? Math.min(width, cell * perRow) : width;
  const inset = (fieldWidth - cell * perRow) / 2;
  const slots: Point[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const offset = inset + ((perRow - inRow) * cell) / 2;
    const lean =
      !still && rows > 1 && inRow === perRow ? (row % 2 ? 1 : -1) * cell * scale.lean : 0;
    const strayX = still ? 0 : Math.sin(i * 12.9898) * scale.jitter;
    const strayY = still ? 0 : Math.cos(i * 78.233) * scale.jitter;
    slots.push({
      x: offset + cell * ((i % perRow) + 0.5) + lean + strayX,
      // Centred a little above the middle of its row: the name sits under it.
      y: scale.pad + scale.rowHeight * (row + 0.5) - 14 + strayY,
    });
  }
  return {
    width: fieldWidth,
    height: scale.pad * 2 + rows * scale.rowHeight,
    size: scale.size,
    slots,
    still,
  };
};

export type Puck = {
  /** Home. */
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** The face's scale and its rate: it swells when warm and squashes on a bump. */
  s: number;
  sv: number;
  /** How warm it is, smoothed: 0 cold, about 1 hot. */
  warmth: number;
  /**
   * Its flight in the arrival: from where, and when it leaves. Until then
   * it waits unseen; in flight it glides home on a fixed curve, through the
   * others, and only joins the physics when it lands.
   */
  flight: { from: Point; startAt: number } | null;
  /** Where the pointer holds it, while dragged. */
  drag: Point | null;
  pressed: boolean;
};

export const restingPuck = ({ x, y }: Point): Puck => ({
  hx: x,
  hy: y,
  x,
  y,
  vx: 0,
  vy: 0,
  s: 1,
  sv: 0,
  warmth: 0,
  flight: null,
  drag: null,
  pressed: false,
});

/** The spring to home, its damping, and how hard the heat pulls (capped). */
const SPRING = 38;
const DAMPING = 6.2;
const PULL = 60000;
const PULL_MAX = 620;
/** Passes that separate overlapping pucks each step. */
const COLLISION_PASSES = 3;
/** How long a puck's flight home in the arrival takes, in seconds. */
const FLIGHT = 0.7;
/** The scale a puck leaves the centre at, growing to its own as it flies. */
const FLIGHT_SCALE = 0.6;

/**
 * Pucks waiting at the centre to fly out to their homes, one after another
 * from `clock`; with many projects they leave closer together, so the
 * arrival takes the same time. A flight is a curve, not physics: the pucks
 * leave from one point, and as bodies they would pile up and scatter there.
 */
export const arrivingPucks = (layout: FieldLayout, clock: number): Puck[] => {
  const gap = layout.slots.length > PHONE_PLAY_LIMIT ? 0.045 : 0.09;
  const from = { x: layout.width / 2, y: layout.height / 2 };
  return layout.slots.map((slot, i) => ({
    ...restingPuck(slot),
    ...from,
    s: FLIGHT_SCALE,
    flight: { from, startAt: clock + 0.25 + i * gap },
  }));
};

/** Whether a puck is still waiting to leave in the arrival, and so unseen. */
export const waiting = (puck: Puck, clock: number) =>
  puck.flight !== null && clock < puck.flight.startAt;

/** Ends a puck's flight where it should end: at home, settling with a soft squash. */
export const land = (puck: Puck) => {
  puck.flight = null;
  puck.x = puck.hx;
  puck.y = puck.hy;
  puck.vx = 0;
  puck.vy = 0;
  puck.s = 1;
  puck.sv = -1.5;
};

/** The ease of a flight: fast out of the centre, slowing into its home. */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** A pulse sent from a click: every puck nearby is pushed away and squashed. */
export const pushFrom = (pucks: Puck[], at: Point, strength = 1) => {
  for (const puck of pucks) {
    if (puck.flight) continue;
    const dx = puck.x - at.x;
    const dy = puck.y - at.y;
    const d = Math.hypot(dx, dy) || 1;
    const f = Math.exp(-(d * d) / (2 * 210 * 210)) * strength;
    puck.vx += (dx / d) * 760 * f;
    puck.vy += (dy / d) * 760 * f;
    puck.sv -= 4 * f;
  }
};

/** The scale a puck's face settles at: pressed in, lifted, or swollen by its warmth. */
const targetScale = (puck: Puck, lifted: boolean) =>
  puck.pressed ? 0.9 : lifted ? 1.08 : 1 + puck.warmth * 0.08;

export type StepEnv = {
  layout: FieldLayout;
  clock: number;
  /** The heat the pucks lean toward, and the model it follows. */
  pull: { sources: readonly HeatSource[]; model: HeatModel }[];
  /** The puck under the pointer or focus, which swells a little. */
  lifted: number;
  /** Room under each puck for its name, kept clear of the field's foot. */
  nameRoom: number;
};

/**
 * One step of `dt` seconds. A free puck is a damped spring to its home plus
 * the pull of the heat's gradient, so it leans toward warmth and comes back;
 * a dragged one follows the pointer and keeps the speed it was flung with.
 * Pucks then push apart where they overlap and bounce off the field's edges.
 */
export const stepPucks = (pucks: Puck[], dt: number, env: StepEnv) => {
  const { layout, clock } = env;
  const radius = layout.size / 2;
  const apart = layout.size + (layout.width < 640 ? 18 : 28);

  pucks.forEach((puck) => {
    if (puck.flight) {
      const t = (clock - puck.flight.startAt) / FLIGHT;
      if (t < 0) return;
      if (t >= 1) {
        land(puck);
        return;
      }
      const k = easeOutCubic(t);
      const { from } = puck.flight;
      const x = from.x + (puck.hx - from.x) * k;
      const y = from.y + (puck.hy - from.y) * k;
      // Its speed along the curve, so it stretches as it flies.
      puck.vx = (x - puck.x) / dt;
      puck.vy = (y - puck.y) / dt;
      puck.x = x;
      puck.y = y;
      puck.s = FLIGHT_SCALE + (1 - FLIGHT_SCALE) * k;
      return;
    }
    if (puck.drag) {
      puck.vx = puck.vx * 0.5 + ((puck.drag.x - puck.x) / dt) * 0.5;
      puck.vy = puck.vy * 0.5 + ((puck.drag.y - puck.y) / dt) * 0.5;
      puck.x = puck.drag.x;
      puck.y = puck.drag.y;
      return;
    }
    let fx = 0;
    let fy = 0;
    for (const { sources, model } of env.pull) {
      const [gx, gy] = heatGradient(sources, model, puck.x, puck.y, clock);
      fx += gx * PULL;
      fy += gy * PULL;
    }
    const f = Math.hypot(fx, fy);
    if (f > PULL_MAX) {
      fx *= PULL_MAX / f;
      fy *= PULL_MAX / f;
    }
    puck.vx += (SPRING * (puck.hx - puck.x) - DAMPING * puck.vx + fx) * dt;
    puck.vy += (SPRING * (puck.hy - puck.y) - DAMPING * puck.vy + fy) * dt;
  });

  // Overlaps are resolved in a few passes: pushing one pair apart can push
  // one of them into a third, and a single pass left a cluster of three
  // shoving each other back and forth from frame to frame. Only the first
  // pass bounces; the others only separate.
  for (let pass = 0; pass < COLLISION_PASSES; pass++) {
    for (let a = 0; a < pucks.length; a++) {
      for (let b = a + 1; b < pucks.length; b++) {
        const A = pucks[a];
        const B = pucks[b];
        if (A.flight || B.flight) continue;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy);
        if (d >= apart || d === 0) continue;
        const nx = dx / d;
        const ny = dy / d;
        const overlap = apart - d;
        // A held puck does not give way; the other takes all of it.
        const wa = A.drag ? 0 : B.drag ? 1 : 0.5;
        const wb = 1 - wa;
        A.x -= nx * overlap * wa;
        A.y -= ny * overlap * wa;
        B.x += nx * overlap * wb;
        B.y += ny * overlap * wb;
        const closing = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (pass === 0 && closing < 0) {
          const j = -1.5 * closing;
          if (!A.drag) {
            A.vx -= nx * j * wa;
            A.vy -= ny * j * wa;
          }
          if (!B.drag) {
            B.vx += nx * j * wb;
            B.vy += ny * j * wb;
          }
          const kick = Math.min(5, -closing * 0.012);
          A.sv -= kick;
          B.sv -= kick;
        }
      }
    }
  }

  pucks.forEach((puck, i) => {
    if (puck.flight) return;
    if (!puck.drag) {
      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;
      const bounce = (speed: number) => (puck.sv -= Math.min(4, Math.abs(speed) * 0.01));
      // The walls stand EDGE inside the field: it has no visible edge (it
      // fades into the page), so a flung puck turns back inside the fade
      // rather than against nothing.
      const left = EDGE + radius;
      const right = layout.width - EDGE - radius;
      const top = EDGE + radius;
      const bottom = layout.height - radius - env.nameRoom;
      if (puck.x < left) {
        puck.x = left;
        puck.vx = Math.abs(puck.vx) * 0.6;
        bounce(puck.vx);
      } else if (puck.x > right) {
        puck.x = right;
        puck.vx = -Math.abs(puck.vx) * 0.6;
        bounce(puck.vx);
      }
      if (puck.y < top) {
        puck.y = top;
        puck.vy = Math.abs(puck.vy) * 0.6;
        bounce(puck.vy);
      } else if (puck.y > bottom) {
        puck.y = bottom;
        puck.vy = -Math.abs(puck.vy) * 0.6;
        bounce(puck.vy);
      }
    }
    const heat = env.pull.reduce(
      (sum, { sources, model }) => sum + heatAt(sources, model, puck.x, puck.y, clock),
      0,
    );
    const target = targetScale(puck, i === env.lifted);
    puck.sv += (230 * (target - puck.s) - 15 * puck.sv) * dt;
    puck.s += puck.sv * dt;
    puck.warmth += (Math.min(1, heat) - puck.warmth) * Math.min(1, dt * 6);
  });
};

/**
 * Whether every puck is home and still, so the loop can stop. A lifted or
 * pressed puck is still once its face has reached its size: resting the
 * pointer on a puck must not keep the field painting.
 */
export const settled = (pucks: readonly Puck[], lifted = -1) =>
  pucks.every(
    (puck, i) =>
      puck.flight === null &&
      !puck.drag &&
      Math.abs(puck.x - puck.hx) < 0.3 &&
      Math.abs(puck.y - puck.hy) < 0.3 &&
      Math.hypot(puck.vx, puck.vy) < 2 &&
      Math.abs(puck.s - targetScale(puck, i === lifted)) < 0.004 &&
      Math.abs(puck.sv) < 0.05 &&
      puck.warmth < 0.01,
  );

export type Direction = "left" | "right" | "up" | "down";

const VECTORS: Record<Direction, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

/**
 * The puck an arrow key moves to: the nearest home that lies that way,
 * favouring one straight ahead over one off to the side. With none that way,
 * the next or previous puck in reading order, so focus never sticks.
 */
export const neighbour = (slots: readonly Point[], from: number, direction: Direction) => {
  const d = VECTORS[direction];
  const here = slots[from];
  let best = -1;
  let bestScore = Infinity;
  slots.forEach((slot, i) => {
    if (i === from) return;
    const dx = slot.x - here.x;
    const dy = slot.y - here.y;
    const along = dx * d.x + dy * d.y;
    if (along <= 4) return;
    const score = along + Math.abs(dx * d.y - dy * d.x) * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  if (best >= 0) return best;
  const step = d.x + d.y > 0 ? 1 : -1;
  return (from + step + slots.length) % slots.length;
};
