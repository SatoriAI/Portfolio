/**
 * Geometry for the research map: a small graph whose nodes are soft blobs
 * that breathe and drift. Everything here is pure, in px, and takes the time
 * in seconds, so the figure only has to call it once a frame.
 */

export type Point = { x: number; y: number };

export type NodeKey = "kernels" | "harmonic" | "reasoning" | "functional" | "quantum";

/** Which topics each field joins: topics meet only through a field. */
export const EDGES: readonly (readonly [NodeKey, NodeKey])[] = [
  ["kernels", "harmonic"],
  ["harmonic", "reasoning"],
  ["kernels", "functional"],
  ["functional", "quantum"],
];

export type LabelSide = "above" | "below" | "right";

export type MapLayout = {
  /** Height in px; the width is the container's. */
  height: number;
  /** Where each node's centre rests, as fractions of width and height. */
  at: Record<NodeKey, Point>;
  /** Where each label sits relative to its node. */
  labels: Record<NodeKey, LabelSide>;
};

/**
 * Wide: harmonic analysis at the centre, between the two topics it joins —
 * heat kernels on the left, reasoning in AI on the right. Below, functional
 * analysis between heat kernels and the quantum algorithm. Names go where no
 * line runs: over the two outer topics, under the rest.
 */
export const WIDE: MapLayout = {
  height: 400,
  at: {
    kernels: { x: 0.15, y: 0.4 },
    harmonic: { x: 0.5, y: 0.4 },
    reasoning: { x: 0.85, y: 0.4 },
    functional: { x: 0.5, y: 0.8 },
    quantum: { x: 0.85, y: 0.8 },
  },
  labels: {
    kernels: "above",
    harmonic: "below",
    reasoning: "above",
    functional: "below",
    quantum: "below",
  },
};

/**
 * Narrow: one column read top to bottom, fields indented, labels to the right
 * at full size.
 */
export const NARROW: MapLayout = {
  height: 560,
  at: {
    reasoning: { x: 0.16, y: 0.08 },
    harmonic: { x: 0.29, y: 0.28 },
    kernels: { x: 0.16, y: 0.48 },
    functional: { x: 0.29, y: 0.69 },
    quantum: { x: 0.16, y: 0.9 },
  },
  labels: {
    kernels: "right",
    harmonic: "right",
    reasoning: "right",
    functional: "right",
    quantum: "right",
  },
};

/** Below this width the wide layout's labels would collide. */
export const NARROW_BELOW = 420;

export const layoutFor = (width: number) => (width < NARROW_BELOW ? NARROW : WIDE);

/** Each node's own rhythm, so no two breathe or drift in step. */
export const SEEDS: Record<NodeKey, number> = {
  kernels: 0.3,
  harmonic: 1.9,
  reasoning: 3.4,
  functional: 4.6,
  quantum: 5.8,
};

/** A slow drift of a node's centre, at most `amount` px each way. */
export const drift = (time: number, seed: number, amount: number): Point => ({
  x: amount * Math.sin(0.55 * time + seed),
  y: amount * Math.cos(0.43 * time + 1.7 * seed),
});

/**
 * The part of the line between two centres that lies outside both nodes, so
 * an edge meets a blob at its rim and an arrowhead lands on it.
 */
export const trim = (from: Point, to: Point, fromRadius: number, toRadius: number) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  return {
    start: { x: from.x + ux * fromRadius, y: from.y + uy * fromRadius },
    end: { x: to.x - ux * toRadius, y: to.y - uy * toRadius },
  };
};

/** Words into lines of at most `maxChars`, never breaking a word. */
export const wrapLabel = (text: string, maxChars: number) =>
  text.split(" ").reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
    return lines;
  }, []);
