import { GROKKING_RUNS, GROKKING_STEPS } from "@/lib/grokking";

/**
 * The grokking thumbnail's layout (components/workshop/GrokkingThumbnail),
 * in CSS pixels at the width it is measured at: its scales, and the band
 * that marks the delay between knowing the training data and generalising.
 */

export const HEIGHT = 190;
export const PAD = { left: 36, right: 8, top: 10, bottom: 24 };
export const LAST_STEP = GROKKING_STEPS[GROKKING_STEPS.length - 1];

/** From the step every run knows its training data to the step every run passes 50% on new data. */
const firstStepWhere = (test: (values: number[]) => boolean, metric: "train" | "test") =>
  GROKKING_STEPS.find((step) =>
    test(GROKKING_RUNS.map((run) => run.points.find((point) => point.step === step)![metric])),
  ) ?? LAST_STEP;
export const DELAY_FROM = firstStepWhere((values) => values.every((v) => v >= 0.99), "train");
export const DELAY_TO = firstStepWhere((values) => values.every((v) => v >= 0.5), "test");

export const thumbnailScales = (width: number) => ({
  x: (step: number) => PAD.left + ((width - PAD.left - PAD.right) * step) / LAST_STEP,
  y: (value: number) => PAD.top + (HEIGHT - PAD.top - PAD.bottom) * (1 - value),
});

/**
 * The delay band, or null in a box no wider than its padding (a window about
 * 140 px wide): there the plot has no width, the step scale runs backwards,
 * and the band would be a rectangle of negative width, which SVG rejects.
 */
export const delayBand = (width: number) => {
  if (width <= PAD.left + PAD.right) return null;
  const { x, y } = thumbnailScales(width);
  return {
    x: x(DELAY_FROM),
    y: y(1),
    width: x(DELAY_TO) - x(DELAY_FROM),
    height: y(0) - y(1),
  };
};
