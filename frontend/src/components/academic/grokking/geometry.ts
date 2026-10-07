import { GROKKING_STEPS, linearScale } from "@/lib/grokking";

/** The top margin holds the guess's name, above the 100% line, clear of every line. */
export const MARGIN = { left: 44, right: 24, top: 46, bottom: 30 };

/** The last measured step, where the step axis ends. */
export const STEP_MAX = GROKKING_STEPS[GROKKING_STEPS.length - 1];

/**
 * The plot laid out at a width in CSS pixels, so text in it stays at its set
 * size: the scales both ways, the step under a pointer, and how often the
 * step axis is labelled. Wide and low across the section; a little taller on
 * a phone, where the plot is narrow and a flat one would bury the rise, and
 * every other step labelled when a phone leaves too little room between them.
 */
export const plotGeometry = (width: number) => {
  const height = width < 640 ? 272 : 252;
  const x = linearScale(0, STEP_MAX, MARGIN.left, width - MARGIN.right);
  return {
    width,
    height,
    x,
    y: linearScale(0, 1, height - MARGIN.bottom, MARGIN.top),
    stepAt: linearScale(MARGIN.left, width - MARGIN.right, 0, STEP_MAX),
    tickEvery: x(GROKKING_STEPS[1]) - x(GROKKING_STEPS[0]) < 48 ? 2 : 1,
  };
};

export type PlotGeometry = ReturnType<typeof plotGeometry>;
