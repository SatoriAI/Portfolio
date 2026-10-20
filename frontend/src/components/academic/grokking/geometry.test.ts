import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { PLOT_HEIGHT, plotGeometry } from "./geometry";

describe("plotGeometry", () => {
  it("is PLOT_HEIGHT tall: narrow below its step, wide from it", () => {
    for (const width of [280, 308, PLOT_HEIGHT.from - 0.5])
      expect(plotGeometry(width).height).toBe(PLOT_HEIGHT.narrow);
    for (const width of [PLOT_HEIGHT.from, 998, 1400])
      expect(plotGeometry(width).height).toBe(PLOT_HEIGHT.wide);
  });

  it("is the height GrokkingPlot's CSS gives the plot before it is measured", () => {
    const plot = readFileSync(
      fileURLToPath(new URL("./GrokkingPlot.tsx", import.meta.url)),
      "utf8",
    );
    expect(plot).toContain(`h-[${PLOT_HEIGHT.narrow}px]`);
    expect(plot).toContain(
      `[@container(min-width:${PLOT_HEIGHT.from}px)]:h-[${PLOT_HEIGHT.wide}px]`,
    );
  });
});
