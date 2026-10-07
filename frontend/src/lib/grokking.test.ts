import { describe, expect, it } from "vitest";

import { translations } from "@/utils/translations";

import {
  crossingRange,
  describeStep,
  GROKKING_RUNS,
  GROKKING_STEPS,
  guessVerdict,
  linearScale,
  measuredPath,
  nearestStep,
  percentFormat,
  placeBeside,
  readoutAt,
  runSegments,
  segmentCrossesBox,
  stepSentence,
  valuesAt,
} from "./grokking";

describe("GROKKING_RUNS", () => {
  it("holds three seeds evaluated at the same seven steps", () => {
    expect(GROKKING_RUNS.map((run) => run.seed)).toEqual([0, 1, 2]);
    for (const run of GROKKING_RUNS) {
      expect(run.points.map((p) => p.step)).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000]);
    }
    expect(GROKKING_STEPS).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000]);
  });

  it("keeps every accuracy a fraction", () => {
    for (const run of GROKKING_RUNS) {
      for (const p of run.points) {
        for (const value of [p.train, p.test]) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("valuesAt", () => {
  it("reads one value per run at a step", () => {
    expect(valuesAt(GROKKING_RUNS, 1000, "test")).toEqual([0.0865, 0.0554, 0.0578]);
    expect(valuesAt(GROKKING_RUNS, 1000, "train")).toEqual([1, 1, 1]);
  });

  it("skips a step a run did not log", () => {
    expect(valuesAt(GROKKING_RUNS, 1500, "test")).toEqual([]);
  });
});

describe("the claims the prose makes", () => {
  // The finding under the chart says that by step 1000 the model answers
  // every training example correctly, and that one to two thousand steps
  // later it passes 50% on new ones as well.
  it("answers every training example correctly by step 1000", () => {
    expect(valuesAt(GROKKING_RUNS, 1000, "train")).toEqual([1, 1, 1]);
  });

  it("passes 50% on new examples one to two thousand steps after that", () => {
    const { min, max } = crossingRange(GROKKING_RUNS);
    expect(min - 1000).toBeGreaterThanOrEqual(1000);
    expect(max - 1000).toBeLessThanOrEqual(2000);
  });
});

describe("describeStep", () => {
  const shown = percentFormat("en").format;

  it("reads each step in the shape its data takes across the three runs", () => {
    expect(GROKKING_STEPS.map((step) => describeStep(GROKKING_RUNS, step, shown).kind)).toEqual([
      "bothVary",
      "seenFixed",
      "seenFixed",
      "seenFixed",
      "same",
      "bothVary",
      "same",
    ]);
  });

  // "ranges from 100% to 100%" would be a sentence about nothing: a range is
  // only ever said of a measure that varies.
  it("calls a measure a range only where its runs differ as shown", () => {
    for (const step of GROKKING_STEPS) {
      const description = describeStep(GROKKING_RUNS, step, shown);
      if (description.kind === "bothVary") {
        expect(shown(description.seen.min)).not.toBe(shown(description.seen.max));
        expect(shown(description.unseen.min)).not.toBe(shown(description.unseen.max));
      }
      if (description.kind === "seenFixed") {
        expect(shown(description.unseen.min)).not.toBe(shown(description.unseen.max));
      }
    }
  });
});

describe("readoutAt", () => {
  const shown = percentFormat("en").format;

  it("gives one value per run while the runs differ", () => {
    expect(readoutAt(GROKKING_RUNS, 1000, "test", shown)).toEqual(["8.7%", "5.5%", "5.8%"]);
  });

  it("gives the value once when every run shows it", () => {
    expect(readoutAt(GROKKING_RUNS, 1000, "train", shown)).toEqual(["100%"]);
    expect(readoutAt(GROKKING_RUNS, 6000, "test", shown)).toEqual(["100%"]);
  });
});

describe("stepSentence", () => {
  // Typesetting binds Polish one-letter words with no-break spaces, and word
  // joiners hold a range together; neither is part of the wording.
  const plain = (text: string) => text.replace(/\u00a0/g, " ").replace(/\u2060/g, "");
  const en = (step: number) =>
    stepSentence(
      translations.en.academic.interests.transformers.chart.stepNote,
      GROKKING_RUNS,
      step,
      "en",
    );
  const pl = (step: number) =>
    plain(
      stepSentence(
        translations.pl.academic.interests.transformers.chart.stepNote,
        GROKKING_RUNS,
        step,
        "pl",
      ),
    );

  it("says step 1000 as the brief words it", () => {
    expect(en(1000)).toBe(
      "Step 1,000: accuracy on training examples is 100% in all three runs, while accuracy on new examples ranges from 5.5% to 8.7%.",
    );
    expect(pl(1000)).toBe(
      "Krok 1000: trafność na przykładach treningowych wynosi 100% we wszystkich trzech przebiegach, a na nowych 5,5–8,7%.",
    );
  });

  it("says step 6000 as the brief words it", () => {
    expect(en(6000)).toBe(
      "Step 6,000: accuracy on both training and new examples is 100% in all three runs.",
    );
    expect(pl(6000)).toBe(
      "Krok 6000: we wszystkich trzech przebiegach trafność na przykładach treningowych i nowych wynosi 100%.",
    );
  });

  // The sentence must never show a value from another step: every percentage
  // it states is one the selected step's own runs show, and it names the step.
  it("states only the selected step's own values, and names that step", () => {
    const shown = percentFormat("en").format;
    for (const step of GROKKING_STEPS) {
      const sentence = en(step);
      expect(sentence.startsWith(`Step ${new Intl.NumberFormat("en").format(step)}:`)).toBe(true);
      const own = new Set(
        [...valuesAt(GROKKING_RUNS, step, "train"), ...valuesAt(GROKKING_RUNS, step, "test")].map(
          shown,
        ),
      );
      for (const value of sentence.match(/\d+(\.\d+)?%/g) ?? []) {
        expect(own).toContain(value);
      }
      expect(sentence).not.toMatch(/\{\w+\}/);
    }
  });
});

describe("linearScale", () => {
  it("maps the ends of the domain onto the ends of the range, reversed if asked", () => {
    const y = linearScale(0, 1, 200, 20);
    expect(y(0)).toBe(200);
    expect(y(1)).toBe(20);
    expect(y(0.5)).toBe(110);
  });
});

describe("measuredPath", () => {
  it("joins the measurements with straight segments only", () => {
    const x = linearScale(0, 6000, 0, 600);
    const y = linearScale(0, 1, 100, 0);
    const d = measuredPath(GROKKING_RUNS[1].points, "test", x, y);
    expect(d.replace(/[\d. -]/g, "")).toBe("MLLLLLL");
    expect(d.startsWith("M0.0 99.2")).toBe(true);
  });
});

describe("nearestStep", () => {
  it("snaps to the closest evaluated step", () => {
    expect(nearestStep(GROKKING_STEPS, 0)).toBe(0);
    expect(nearestStep(GROKKING_STEPS, 1400)).toBe(1000);
    expect(nearestStep(GROKKING_STEPS, 1600)).toBe(2000);
    expect(nearestStep(GROKKING_STEPS, 9000)).toBe(6000);
  });
});

describe("the chart's key", () => {
  // The key sits in the plot's lower-right quarter; it covers no line only
  // because every run has risen by then.
  it("has its corner to itself: from step 3000 every run is at 80% or more", () => {
    for (const run of GROKKING_RUNS) {
      for (const p of run.points.filter((point) => point.step >= 3000)) {
        expect(p.train).toBeGreaterThanOrEqual(0.8);
        expect(p.test).toBeGreaterThanOrEqual(0.8);
      }
    }
  });
});

describe("runSegments", () => {
  it("gives six pieces per line, two lines for each of the three runs", () => {
    const segments = runSegments(
      GROKKING_RUNS,
      linearScale(0, 6000, 0, 600),
      linearScale(0, 1, 100, 0),
    );
    expect(segments).toHaveLength(3 * 2 * 6);
    expect(segments[0]).toMatchObject({ x1: 0, x2: 100 });
  });
});

describe("segmentCrossesBox", () => {
  const box = { left: 10, top: 10, right: 20, bottom: 20 };

  it("finds a segment that passes through the box or lies in it", () => {
    expect(segmentCrossesBox({ x1: 0, y1: 0, x2: 30, y2: 30 }, box)).toBe(true);
    expect(segmentCrossesBox({ x1: 0, y1: 15, x2: 30, y2: 15 }, box)).toBe(true);
    expect(segmentCrossesBox({ x1: 12, y1: 12, x2: 18, y2: 18 }, box)).toBe(true);
  });

  it("misses one that passes by, stops short, or cuts past a corner", () => {
    expect(segmentCrossesBox({ x1: 0, y1: 25, x2: 30, y2: 25 }, box)).toBe(false);
    expect(segmentCrossesBox({ x1: 0, y1: 0, x2: 9, y2: 9 }, box)).toBe(false);
    // Its bounding box overlaps the box; the segment itself does not.
    expect(segmentCrossesBox({ x1: 0, y1: 15, x2: 15, y2: 0 }, box)).toBe(false);
  });
});

describe("placeBeside", () => {
  const bounds = { left: 0, top: 0, right: 200, bottom: 100 };
  const size = { width: 40, height: 20 };

  it("stands right of the line, at mid-height, when that is clear", () => {
    expect(placeBeside({ anchor: 100, ...size, bounds, segments: [] })).toEqual({
      left: 112,
      top: 40,
    });
  });

  it("moves up or down, on the same side, to clear a line", () => {
    const level = { x1: 0, y1: 50, x2: 200, y2: 50 };
    expect(placeBeside({ anchor: 100, ...size, bounds, segments: [level] })).toEqual({
      left: 112,
      top: 16,
    });
  });

  it("goes left of the line when a line crosses every height on the right", () => {
    const rising = { x1: 110, y1: 100, x2: 160, y2: 0 };
    expect(placeBeside({ anchor: 100, ...size, bounds, segments: [rising] })).toEqual({
      left: 48,
      top: 40,
    });
  });

  it("keeps off an obstacle such as the key", () => {
    const key = { left: 100, top: 0, right: 200, bottom: 100 };
    expect(placeBeside({ anchor: 100, ...size, bounds, segments: [], obstacles: [key] })).toEqual({
      left: 48,
      top: 40,
    });
  });

  it("covers an obstacle before it covers what it must keep visible", () => {
    // Too wide for either side of the line, so it is centred on it. At
    // mid-height it covers only the point; everywhere else it meets a key.
    const wide = { width: 150, height: 20 };
    const point = { left: 94, top: 44, right: 106, bottom: 56 };
    const keys = [
      { left: 0, top: 0, right: 200, bottom: 28 },
      { left: 0, top: 72, right: 200, bottom: 100 },
    ];
    const { top } = placeBeside({
      anchor: 100,
      ...wide,
      bounds,
      segments: [],
      obstacles: keys,
      keepVisible: [point],
    });
    expect(top + wide.height <= point.top || top >= point.bottom).toBe(true);
  });

  it("still shows when nothing is clear, inside the bounds", () => {
    const stripes = Array.from({ length: 11 }, (_, i) => ({
      x1: 0,
      y1: i * 10,
      x2: 200,
      y2: i * 10,
    }));
    const { left, top } = placeBeside({ anchor: 100, ...size, bounds, segments: stripes });
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + size.width).toBeLessThanOrEqual(200);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + size.height).toBeLessThanOrEqual(100);
  });
});

describe("crossingRange", () => {
  it("names the measured steps between which new examples pass 50% in every run", () => {
    expect(crossingRange(GROKKING_RUNS)).toEqual({ min: 2000, max: 3000 });
  });

  it("ends on the last run to cross when the runs cross at different steps", () => {
    const run = (seed: number, tests: number[]) => ({
      seed,
      points: tests.map((test, index) => ({ step: index * 1000, train: 1, test })),
    });
    expect(crossingRange([run(0, [0, 0.6, 1]), run(1, [0, 0.2, 0.7])])).toEqual({
      min: 1000,
      max: 2000,
    });
  });
});

describe("guessVerdict", () => {
  const range = { min: 2000, max: 3000 };
  it("is perfect inside the measured range", () => {
    expect(guessVerdict(2000, range)).toBe("perfect");
    expect(guessVerdict(3000, range)).toBe("perfect");
  });
  it("is almost within five hundred steps of it", () => {
    expect(guessVerdict(1500, range)).toBe("almost");
    expect(guessVerdict(3500, range)).toBe("almost");
  });
  it("is wrong further off", () => {
    expect(guessVerdict(1000, range)).toBe("wrong");
    expect(guessVerdict(4000, range)).toBe("wrong");
  });
});
