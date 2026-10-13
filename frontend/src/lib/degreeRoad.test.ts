import { describe, expect, it } from "vitest";

import {
  cubicBezier,
  DISC,
  pointAt,
  roadFrame,
  roadGeometry,
  SPIRAL_OUTER,
  spiralPath,
} from "./degreeRoad";

// The content column at 1024 and 1440 (the container's padding taken off),
// and a phone's.
const COLUMNS = [928, 1160];

describe("roadGeometry", () => {
  it.each(COLUMNS)("keeps every stop's disc inside a %ipx column", (width) => {
    const road = roadGeometry(width, false);
    for (const stop of road.rest) {
      expect(stop.x - DISC / 2).toBeGreaterThanOrEqual(0);
      expect(stop.x + DISC / 2).toBeLessThanOrEqual(width);
      expect(stop.y - DISC / 2).toBeGreaterThanOrEqual(0);
    }
    // Earliest on the left, the road running on to the column's edge.
    expect(road.rest.map((stop) => stop.x)).toEqual(
      [...road.rest.map((stop) => stop.x)].sort((a, b) => a - b),
    );
    expect(pointAt(road, road.length).x).toBeCloseTo(width, 0);
    // The first stop's name (about 205px, centred under it) stays in the column.
    expect(road.rest[0].x - 205 / 2).toBeGreaterThanOrEqual(0);
  });

  it.each([...COLUMNS.map((width) => [width, false] as const), [327, true] as const])(
    "passes through each stop (%ipx, phone %s)",
    (width, phone) => {
      const road = roadGeometry(width, phone);
      road.rest.forEach((stop, i) => {
        const on = pointAt(road, road.arcs[i]);
        expect(on.x).toBeCloseTo(stop.x, 0);
        expect(on.y).toBeCloseTo(stop.y, 0);
      });
      expect(road.path.startsWith(`M ${road.rest[0].x} ${road.rest[0].y}`)).toBe(true);
    },
  );

  it("runs rightwards all the way, so it can be cut off across", () => {
    const road = roadGeometry(1160, false);
    for (let i = 1; i < road.samples.length; i++) {
      expect(road.samples[i].x).toBeGreaterThanOrEqual(road.samples[i - 1].x - 1e-6);
    }
  });

  it.each([
    [1160, false],
    [327, true],
  ] as const)("spaces the compact row evenly (%ipx)", (width, phone) => {
    const { compact } = roadGeometry(width, phone);
    const gaps = compact.slice(1).map((stop, i) => stop.x - compact[i].x);
    for (const gap of gaps) expect(Math.abs(gap - gaps[0])).toBeLessThanOrEqual(1);
    expect(new Set(compact.map((stop) => stop.y)).size).toBe(1);
    // Across the whole column, the middle disc in its middle, and the years
    // under the outer discs (about 86px at most, at 12px mono) inside it.
    expect(Math.abs(compact[1].x - width / 2)).toBeLessThanOrEqual(0.5);
    expect(compact[0].x - 43).toBeGreaterThanOrEqual(0);
    expect(compact[compact.length - 1].x + 43).toBeLessThanOrEqual(width);
  });
});

describe("roadFrame", () => {
  it.each([false, true])("starts on the road and ends in the row (phone %s)", (phone) => {
    const road = roadGeometry(phone ? 327 : 1160, phone);
    const start = roadFrame(road, 0);
    const end = roadFrame(road, 1);
    start.stops.forEach((stop, i) => {
      expect(stop.x).toBeCloseTo(road.rest[i].x, 0);
      expect(stop.y).toBeCloseTo(road.rest[i].y, 0);
      expect(stop.scale).toBeCloseTo(road.restScale);
      expect(end.stops[i].x).toBeCloseTo(road.compact[i].x, 0);
      expect(end.stops[i].y).toBeCloseTo(road.compact[i].y, 0);
      expect(end.stops[i].scale).toBeCloseTo(road.compactScale);
    });
    expect([start.names, start.years, start.card]).toEqual([1, 0, 0]);
    expect([end.names, end.years, end.card]).toEqual([0, 1, 1]);
    // The row's line is all laid by the end, and none of it at the start.
    expect([end.rowLine.left, end.rowLine.right]).toEqual([0, 0]);
    expect(start.rowLine.left + start.rowLine.right).toBeGreaterThan(road.width - 1);
  });

  it("winds the road in from its far end, onto a coil that shows only in between", () => {
    const road = roadGeometry(1160, false);
    expect(roadFrame(road, 0).roadOut).toBeCloseTo(road.length);
    expect(roadFrame(road, 0.5).roadOut).toBeCloseTo(0);
    expect(roadFrame(road, 0).spool.opacity).toBe(0);
    expect(roadFrame(road, 0.3).spool.opacity).toBe(1);
    expect(roadFrame(road, 1).spool.opacity).toBe(0);
    // Nothing of the road or the coil is left once the row has formed.
    expect(roadFrame(road, 0.5).roadOpacity).toBe(0);
    expect(roadFrame(road, 0.74).spool.opacity).toBe(0);
    // Mid-way the later stops ride the thread in, never past the first.
    const mid = roadFrame(road, 0.3);
    expect(mid.stops[2].x).toBeLessThan(road.rest[2].x);
    expect(mid.stops[1].x).toBeGreaterThanOrEqual(mid.stops[0].x);
  });
});

describe("spiralPath", () => {
  it("starts at the top, outside", () => {
    expect(spiralPath().startsWith(`M0.00 ${(-SPIRAL_OUTER).toFixed(2)}`)).toBe(true);
  });
});

describe("cubicBezier", () => {
  it("holds its ends and eases out", () => {
    const ease = cubicBezier(0.22, 1, 0.36, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.8);
  });
});
