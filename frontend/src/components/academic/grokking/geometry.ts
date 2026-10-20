import { GROKKING_STEPS, linearScale, STEP_MAX } from "@/lib/grokking";

/** The top margin holds the guess's name, above the 100% line, clear of every line. */
export const MARGIN = { left: 44, right: 24, top: 46, bottom: 30 };

/**
 * The plot's height, which depends on its width only by this one step: a
 * little taller below `from`. The chart's CSS repeats it, to size the plot
 * before it is measured (see GrokkingPlot).
 */
export const PLOT_HEIGHT = { narrow: 272, wide: 252, from: 640 } as const;

/**
 * The plot laid out at a width in CSS pixels, so text in it stays at its set
 * size: the scales both ways, the step under a pointer, and how often the
 * step axis is labelled. Wide and low across the section; a little taller on
 * a phone, where the plot is narrow and a flat one would bury the rise, and
 * every other step labelled when a phone leaves too little room between them.
 */
export const plotGeometry = (width: number) => {
  const height = width < PLOT_HEIGHT.from ? PLOT_HEIGHT.narrow : PLOT_HEIGHT.wide;
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
