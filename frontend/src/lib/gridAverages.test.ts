import { describe, expect, it } from "vitest";

import {
  cellAverages,
  CELLS_DEFAULT,
  CELLS_MAX,
  CELLS_MIN,
  gridReading,
  keptPercent,
  productExample,
  seenWave,
  seenWaves,
  wave,
  WAVES,
} from "./gridAverages";

/** The wave's average over [from, to], by the midpoint rule on many points. */
const numericAverage = (from: number, to: number) => {
  const steps = 4000;
  let sum = 0;
  for (let i = 0; i < steps; i++) sum += wave(from + ((to - from) * (i + 0.5)) / steps);
  return sum / steps;
};

describe("cellAverages", () => {
  it("are the wave's true averages over each cell", () => {
    for (const n of [CELLS_MIN, 7, CELLS_DEFAULT, 13, CELLS_MAX]) {
      cellAverages(n).forEach((average, j) =>
        expect(average).toBeCloseTo(numericAverage(j / n, (j + 1) / n), 6),
      );
    }
  });

  it("vanish on a grid whose cells each hold whole oscillations", () => {
    for (const average of cellAverages(WAVES)) expect(average).toBeCloseTo(0, 12);
    expect(gridReading(WAVES, WAVES)).toBe("vanished");
    expect(keptPercent(WAVES, WAVES)).toBe(0);
  });

  it("keep almost the whole wave on a fine grid", () => {
    expect(gridReading(WAVES, CELLS_MAX)).toBe("follows");
    expect(keptPercent(WAVES, CELLS_MAX)).toBeGreaterThanOrEqual(95);
  });
});

describe("seenWaves", () => {
  it("folds the wave's frequency into what the grid can show", () => {
    expect(seenWaves(5, 30)).toBe(5);
    expect(seenWaves(5, 10)).toBe(5);
    expect(seenWaves(5, 8)).toBe(3);
    expect(seenWaves(5, 6)).toBe(1);
    expect(seenWaves(5, 5)).toBe(0);
    expect(seenWaves(5, 4)).toBe(1);
    expect(seenWaves(5, 3)).toBe(1);
  });

  it("calls a folded wave slower", () => {
    expect(gridReading(5, CELLS_DEFAULT)).toBe("slower");
    expect(gridReading(5, 10)).toBe("follows");
  });
});

describe("seenWave", () => {
  it("passes through every cell average at its cell's centre", () => {
    for (let n = CELLS_MIN; n <= CELLS_MAX; n++) {
      cellAverages(n).forEach((average, j) =>
        expect(seenWave((j + 0.5) / n, n)).toBeCloseTo(average, 10),
      );
    }
  });

  it("oscillates only as often as the grid sees", () => {
    // Crossings of zero over the period: two per oscillation.
    const crossings = (n: number) => {
      let count = 0;
      const steps = 2000;
      for (let i = 0; i < steps; i++) {
        if (Math.sign(seenWave(i / steps, n)) !== Math.sign(seenWave((i + 1) / steps, n))) count++;
      }
      return count;
    };
    expect(crossings(CELLS_DEFAULT)).toBe(2 * seenWaves(WAVES, CELLS_DEFAULT));
    expect(crossings(6)).toBe(2);
  });
});

describe("productExample", () => {
  it("reproduces the piece's example: 1, 3 and 3, 1", () => {
    const example = productExample(1);
    expect(example.u).toEqual([3, 1]);
    expect(example.product).toEqual([3, 3]);
    expect(example.meanB).toBe(2);
    expect(example.meanU).toBe(2);
    expect(example.productOfMeans).toBe(4);
    expect(example.meanOfProduct).toBe(3);
  });

  it("puts the whole gap in the covariance, whichever way u moves", () => {
    for (const d of [-1, -0.5, 0, 0.5, 1]) {
      const example = productExample(d);
      expect(example.meanOfProduct - example.productOfMeans).toBeCloseTo(example.covariance, 12);
      expect(example.productOfMeans).toBe(4);
    }
    expect(productExample(0).covariance).toBe(0);
    expect(productExample(-1).covariance).toBe(1);
  });
});
