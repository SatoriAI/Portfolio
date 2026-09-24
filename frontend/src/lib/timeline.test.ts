import { describe, expect, it } from "vitest";

import { buildTimeline } from "./timeline";

const NOW = new Date("2026-09-15T00:00:00Z");

describe("buildTimeline", () => {
  it("runs from the first start to the month after the last end", () => {
    const timeline = buildTimeline(
      [
        { id: 1, start: "2019-10-01", end: "2023-04-30" },
        { id: 2, start: "2024-04-01", end: "2025-07-31" },
      ],
      NOW,
    );
    // October 2019 through July 2025 inclusive is 70 months.
    expect(timeline.months).toBe(70);
    expect(timeline.spans[0]).toMatchObject({ id: 1, startMonth: 0, endMonth: 43, lane: 0 });
    expect(timeline.spans[1]).toMatchObject({ id: 2, startMonth: 54, endMonth: 70, lane: 0 });
  });

  it("stacks concurrent roles into separate lanes and reuses a freed lane", () => {
    const timeline = buildTimeline(
      [
        { id: 1, start: "2019-10-01", end: "2023-04-30" },
        { id: 2, start: "2022-02-01", end: "2023-01-31" },
        { id: 3, start: "2022-09-01", end: "" },
        { id: 4, start: "2024-04-01", end: "2025-07-31" },
      ],
      NOW,
    );
    const lanes = Object.fromEntries(timeline.spans.map((span) => [span.id, span.lane]));
    expect(lanes).toEqual({ 1: 0, 2: 1, 3: 2, 4: 0 });
    expect(timeline.lanes).toBe(3);
  });

  it("extends a running role to the month after now and marks it current", () => {
    const timeline = buildTimeline([{ id: 3, start: "2022-09-01", end: "" }], NOW);
    expect(timeline.spans[0]).toMatchObject({ current: true, endMonth: 49 });
    expect(timeline.months).toBe(49);
  });

  it("places a tick at every January inside the domain", () => {
    const timeline = buildTimeline([{ id: 1, start: "2019-10-01", end: "2021-03-31" }], NOW);
    expect(timeline.ticks).toEqual([
      { year: 2020, month: 3 },
      { year: 2021, month: 15 },
    ]);
  });

  it("ignores entries without a start and copes with none", () => {
    expect(buildTimeline([{ id: 1, start: "", end: "" }], NOW)).toEqual({
      spans: [],
      months: 0,
      lanes: 0,
      ticks: [],
    });
  });
});
