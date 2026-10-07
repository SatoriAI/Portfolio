/**
 * Accuracy of the modular-addition models over their first 6000 training
 * steps, as the training runs logged it.
 *
 * Source: spectral-grokking, outputs/01_baseline_grokking/, the history.json
 * of runs grok_p113_seed0_20260603-211611, grok_p113_seed1_20260603-214333
 * and grok_p113_seed2_20260601-235127 — the runs the later analyses use. The
 * three configurations differ only in the seed: addition mod p = 113, 30% of
 * all pairs (a, b) in training, a two-layer transformer, evaluated every 1000
 * steps. Values are the logged fractions rounded to four decimals; nothing is
 * interpolated between the evaluations.
 */

export type Metric = "train" | "test";

export type GrokkingPoint = { step: number } & Record<Metric, number>;

export type GrokkingRun = { seed: number; points: readonly GrokkingPoint[] };

export const GROKKING_RUNS: readonly GrokkingRun[] = [
  {
    seed: 0,
    points: [
      { step: 0, train: 0.0089, test: 0.0086 },
      { step: 1000, train: 1, test: 0.0865 },
      { step: 2000, train: 1, test: 0.29 },
      { step: 3000, train: 1, test: 0.999 },
      { step: 4000, train: 1, test: 0.9999 },
      { step: 5000, train: 0.9773, test: 0.9597 },
      { step: 6000, train: 1, test: 1 },
    ],
  },
  {
    seed: 1,
    points: [
      { step: 0, train: 0.012, test: 0.0083 },
      { step: 1000, train: 1, test: 0.0554 },
      { step: 2000, train: 1, test: 0.3832 },
      { step: 3000, train: 1, test: 1 },
      { step: 4000, train: 1, test: 1 },
      { step: 5000, train: 1, test: 1 },
      { step: 6000, train: 1, test: 1 },
    ],
  },
  {
    seed: 2,
    points: [
      { step: 0, train: 0.0097, test: 0.0081 },
      { step: 1000, train: 1, test: 0.0578 },
      { step: 2000, train: 1, test: 0.1498 },
      { step: 3000, train: 1, test: 0.8467 },
      { step: 4000, train: 1, test: 0.9999 },
      { step: 5000, train: 1, test: 1 },
      { step: 6000, train: 1, test: 1 },
    ],
  },
];

/** The evaluated steps, shared by every run. */
export const GROKKING_STEPS: readonly number[] = GROKKING_RUNS[0].points.map((p) => p.step);

/** The value at `step` in each run, in run order. */
export const valuesAt = (runs: readonly GrokkingRun[], step: number, metric: Metric): number[] =>
  runs.flatMap((run) => {
    const point = run.points.find((p) => p.step === step);
    return point ? [point[metric]] : [];
  });

export type Spread = { min: number; max: number };

/**
 * Between which measured steps accuracy on new examples first passes `level`
 * in every run: from the latest step still below it in any run, to the step
 * at which the last run has passed it. Only measured steps are named, since
 * nothing was measured in between.
 */
export const crossingRange = (runs: readonly GrokkingRun[], level = 0.5): Spread => {
  const crossings = runs.map((run) => {
    const index = run.points.findIndex((point) => point.test >= level);
    const at = index === -1 ? run.points.length - 1 : index;
    return { before: run.points[Math.max(0, at - 1)].step, after: run.points[at].step };
  });
  return {
    min: Math.max(...crossings.map((crossing) => crossing.before)),
    max: Math.max(...crossings.map((crossing) => crossing.after)),
  };
};

/** Where every run passed 50% on new examples: what a guess is graded against. */
export const GROKKING_CROSSING = crossingRange(GROKKING_RUNS);

/** How a reader's guess of that step compares with the measured range. */
export type GuessVerdict = "perfect" | "almost" | "wrong";
/** A guess this close to the range, in steps, is nearly right: one notch of the guess. */
export const ALMOST_WITHIN = 500;
export const guessVerdict = (guess: number, range: Spread): GuessVerdict => {
  const off = guess < range.min ? range.min - guess : guess > range.max ? guess - range.max : 0;
  return off === 0 ? "perfect" : off <= ALMOST_WITHIN ? "almost" : "wrong";
};

/** The lowest and the highest value across the runs at one step. */
export const spreadAt = (runs: readonly GrokkingRun[], step: number, metric: Metric): Spread => {
  const values = valuesAt(runs, step, metric);
  return { min: Math.min(...values), max: Math.max(...values) };
};

/**
 * The chart's one percent format. The tooltip and the sentence both use it,
 * so they never round the same value two ways.
 */
export const percentFormat = (locale: string) =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

/**
 * One measure at one step as the tooltip reads it: a value per run, or a
 * single value when every run shows the same one — "100%", not "100% · 100%
 * · 100%". Judged as shown, like the sentence.
 */
export const readoutAt = (
  runs: readonly GrokkingRun[],
  step: number,
  metric: Metric,
  shown: (value: number) => string,
): string[] => {
  const values = valuesAt(runs, step, metric).map(shown);
  return new Set(values).size === 1 ? values.slice(0, 1) : values;
};

/**
 * How a sentence may describe one step across the three runs. It is judged
 * on the values as shown, since "100%" must mean what the tooltip shows:
 * studied and new problems at one shared value (`same`); studied problems at
 * one value while new ones vary (`seenFixed`); or both varying (`bothVary`).
 */
export type StepDescription =
  | { kind: "same"; value: number }
  | { kind: "seenFixed"; seen: number; unseen: Spread }
  | { kind: "bothVary"; seen: Spread; unseen: Spread };

export const describeStep = (
  runs: readonly GrokkingRun[],
  step: number,
  shown: (value: number) => string,
): StepDescription => {
  const seen = spreadAt(runs, step, "train");
  const unseen = spreadAt(runs, step, "test");
  const fixed = ({ min, max }: Spread) => shown(min) === shown(max);
  if (fixed(seen) && fixed(unseen) && shown(seen.max) === shown(unseen.max)) {
    return { kind: "same", value: seen.max };
  }
  if (fixed(seen) && !fixed(unseen)) return { kind: "seenFixed", seen: seen.max, unseen };
  return { kind: "bothVary", seen, unseen };
};

/**
 * The sentence about one step, filled from that step's data and nothing
 * else. A template may use `{step}` and `{value}`; a measure that varies as a
 * range, `{seen}` or `{unseen}` ("5.5–8.7%"), or as its ends, `{seenMin}` to
 * `{unseenMax}`; a measure that does not vary as `{seen}` alone. A
 * placeholder with nothing to fill it stays visible rather than vanish.
 */
export const stepSentence = (
  templates: Readonly<Record<StepDescription["kind"], string>>,
  runs: readonly GrokkingRun[],
  step: number,
  locale: string,
): string => {
  const percent = percentFormat(locale);
  // A range's first end without its sign, from the formatter's own parts:
  // by hand, 0.0865 * 100 is 8.6499…, which rounds to 8.6 where it shows 8.7.
  const withoutSign = (value: number) =>
    percent
      .formatToParts(value)
      .filter((part) => part.type !== "percentSign" && part.type !== "literal")
      .map((part) => part.value)
      .join("");
  // Word joiners keep a range on one line: "5,5–" never ends a line.
  const range = ({ min, max }: Spread) => `${withoutSign(min)}\u2060–\u2060${percent.format(max)}`;
  const ends = (name: "seen" | "unseen", spread: Spread) => ({
    [name]: range(spread),
    [`${name}Min`]: percent.format(spread.min),
    [`${name}Max`]: percent.format(spread.max),
  });
  const description = describeStep(runs, step, percent.format);
  const words: Record<string, string> = {
    step: new Intl.NumberFormat(locale).format(step),
    ...(description.kind === "same"
      ? { value: percent.format(description.value) }
      : description.kind === "seenFixed"
        ? { seen: percent.format(description.seen), ...ends("unseen", description.unseen) }
        : { ...ends("seen", description.seen), ...ends("unseen", description.unseen) }),
  };
  return templates[description.kind].replace(
    /\{(\w+)\}/g,
    (placeholder, key: string) => words[key] ?? placeholder,
  );
};

/** A linear map from [d0, d1] onto [r0, r1]. */
export const linearScale =
  (d0: number, d1: number, r0: number, r1: number) =>
  (value: number): number =>
    r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);

/**
 * The polyline through a run's measurements: straight segments between the
 * points and nothing else, so the drawing claims no more than was logged.
 */
export const measuredPath = (
  points: readonly GrokkingPoint[],
  metric: Metric,
  x: (step: number) => number,
  y: (accuracy: number) => number,
): string =>
  points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.step).toFixed(1)} ${y(p[metric]).toFixed(1)}`)
    .join(" ");

/** The evaluated step nearest to `step`. */
export const nearestStep = (steps: readonly number[], step: number): number =>
  steps.reduce((best, candidate) =>
    Math.abs(candidate - step) < Math.abs(best - step) ? candidate : best,
  );

/** A rectangle in the plot's pixels, y growing downwards. */
export type Box = { left: number; top: number; right: number; bottom: number };

/** One straight piece of a drawn line, in the plot's pixels. */
export type Segment = { x1: number; y1: number; x2: number; y2: number };

/** Every straight piece of both lines of every run, in the plot's pixels. */
export const runSegments = (
  runs: readonly GrokkingRun[],
  x: (step: number) => number,
  y: (accuracy: number) => number,
): Segment[] =>
  runs.flatMap((run) =>
    (["train", "test"] as const).flatMap((metric) =>
      run.points.slice(1).map((p, i) => {
        const from = run.points[i];
        return { x1: x(from.step), y1: y(from[metric]), x2: x(p.step), y2: y(p[metric]) };
      }),
    ),
  );

/**
 * Whether any part of a segment lies inside a box. Liang–Barsky: clip the
 * segment's parameter range edge by edge, and see whether anything is left.
 */
export const segmentCrossesBox = (s: Segment, box: Box): boolean => {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  // Each pair (p, q) is one edge, as the inequality p · t ≤ q.
  const edges: [number, number][] = [
    [-dx, s.x1 - box.left],
    [dx, box.right - s.x1],
    [-dy, s.y1 - box.top],
    [dy, box.bottom - s.y1],
  ];
  let enter = 0;
  let exit = 1;
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
    } else if (p < 0) {
      enter = Math.max(enter, q / p);
    } else {
      exit = Math.min(exit, q / p);
    }
    if (enter > exit) return false;
  }
  return true;
};

const boxesMeet = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export type PlaceBesideOptions = {
  /** The vertical line to stand beside, e.g. a crosshair. */
  anchor: number;
  width: number;
  height: number;
  /** Where the box may go. */
  bounds: Box;
  /** Lines the box should not cross. */
  segments: readonly Segment[];
  /** Boxes it should not cover, such as a key; covering one costs ten lines. */
  obstacles?: readonly Box[];
  /**
   * Boxes it must leave visible, such as the points it reads out: it covers
   * one only if every place it fits covers one.
   */
  keepVisible?: readonly Box[];
  /** Space between the box and the anchor. */
  gap?: number;
  /** Air kept between the box and anything it avoids. */
  clearance?: number;
  /** How finely heights are tried. */
  stepY?: number;
};

/**
 * Where to set a box beside a vertical line so it covers no data: right of
 * the line, then left of it, then centred on it, each tried at every height
 * from the middle of `bounds` outward. The first clear place wins; if none is
 * clear, the one that costs least, so the box always shows.
 */
export const placeBeside = ({
  anchor,
  width,
  height,
  bounds,
  segments,
  obstacles = [],
  keepVisible = [],
  gap = 12,
  clearance = 6,
  stepY = 8,
}: PlaceBesideOptions): { left: number; top: number } => {
  const fits = (left: number) => left >= bounds.left && left + width <= bounds.right;
  const centred = Math.min(Math.max(anchor - width / 2, bounds.left), bounds.right - width);
  const lefts = [anchor + gap, anchor - gap - width].filter(fits).concat(centred);
  const lowest = Math.max(bounds.top, bounds.bottom - height);
  const middle = (bounds.top + lowest) / 2;
  const tops = [middle];
  for (let offset = stepY; middle - offset >= bounds.top; offset += stepY) {
    tops.push(middle - offset);
    if (middle + offset <= lowest) tops.push(middle + offset);
  }

  let best = { left: lefts[0], top: middle };
  let bestCost = Infinity;
  for (const left of lefts) {
    for (const top of tops) {
      const air = {
        left: left - clearance,
        top: top - clearance,
        right: left + width + clearance,
        bottom: top + height + clearance,
      };
      const cost =
        segments.filter((s) => segmentCrossesBox(s, air)).length +
        10 * obstacles.filter((o) => boxesMeet(o, air)).length +
        1000 * keepVisible.filter((k) => boxesMeet(k, air)).length;
      if (cost < bestCost) {
        best = { left, top };
        bestCost = cost;
        if (cost === 0) return best;
      }
    }
  }
  return best;
};
