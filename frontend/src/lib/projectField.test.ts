import { describe, expect, it } from "vitest";

import {
  arrivingPucks,
  EDGE,
  fieldLayout,
  moveToSlot,
  nearestSlot,
  neighbour,
  pushFrom,
  restingPuck,
  settled,
  type StepEnv,
  stepPucks,
} from "./projectField";

const rowsOf = (ys: number[]) => new Set(ys.map((y) => Math.round(y / 100))).size;

describe("fieldLayout", () => {
  it("fills rows evenly, four to six on a desk", () => {
    const seven = fieldLayout(7, 1200, false);
    expect(rowsOf(seven.slots.map((s) => s.y))).toBe(2);
    const counts = [9, 12, 20].map((n) => fieldLayout(n, 1200, false));
    expect(counts.map((l) => l.height)).toEqual(
      [...counts.map((l) => l.height)].sort((a, b) => a - b),
    );
  });

  it("keeps every home inside the field, with room for its name", () => {
    for (const [n, w] of [
      [7, 1200],
      [9, 800],
      [7, 343],
      [20, 1200],
    ]) {
      const layout = fieldLayout(n, w, false);
      for (const { x, y } of layout.slots) {
        expect(x - layout.size / 2).toBeGreaterThanOrEqual(EDGE);
        expect(x + layout.size / 2).toBeLessThanOrEqual(layout.width - EDGE);
        expect(y - layout.size / 2).toBeGreaterThanOrEqual(EDGE);
        expect(y + layout.size / 2 + 24).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it("puts every puck in the same place every time", () => {
    expect(fieldLayout(9, 1200, false)).toEqual(fieldLayout(9, 1200, false));
  });

  it("is a still, ruled grid under reduced motion and for many projects on a phone", () => {
    expect(fieldLayout(7, 1200, true).still).toBe(true);
    expect(fieldLayout(7, 343, false).still).toBe(false);
    const many = fieldLayout(9, 343, false);
    expect(many.still).toBe(true);
    expect(new Set(many.slots.map((s) => s.y)).size).toBe(3);
  });

  it("makes a still grid as wide as its cells, not the room", () => {
    const still = fieldLayout(9, 928, true);
    expect(still.width).toBe(600);
    expect(fieldLayout(9, 928, false).width).toBe(928);
  });
});

const envFor = (n: number): StepEnv => ({
  layout: fieldLayout(n, 1200, false),
  clock: 0,
  pull: [],
  lifted: -1,
  nameRoom: 32,
});

const run = (pucks: ReturnType<typeof restingPuck>[], env: StepEnv, seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 60) {
    env.clock += 1 / 60;
    stepPucks(pucks, 1 / 60, env);
  }
};

describe("stepPucks", () => {
  it("brings the arrival out from the centre to every home, and rests", () => {
    const env = envFor(7);
    const pucks = arrivingPucks(env.layout, 0);
    expect(settled(pucks)).toBe(false);
    run(pucks, env, 4);
    expect(settled(pucks)).toBe(true);
  });

  it("flies each puck home on a smooth curve, never through a collision", () => {
    const env = envFor(9);
    const pucks = arrivingPucks(env.layout, 0);
    const centre = { x: env.layout.width / 2, y: env.layout.height / 2 };
    let worst = 0;
    for (let t = 0; t < 2; t += 1 / 60) {
      env.clock += 1 / 60;
      stepPucks(pucks, 1 / 60, env);
      // Every puck stays on the straight line from the centre to its home.
      for (const p of pucks) {
        const hx = p.hx - centre.x;
        const hy = p.hy - centre.y;
        const off = Math.abs((p.x - centre.x) * hy - (p.y - centre.y) * hx) / Math.hypot(hx, hy);
        worst = Math.max(worst, off);
      }
    }
    expect(worst).toBeLessThan(0.5);
    expect(pucks.every((p) => p.x === p.hx && p.y === p.hy)).toBe(true);
    run(pucks, env, 1);
    expect(settled(pucks)).toBe(true);
  });

  it("parts three pucks pressed together in one step", () => {
    const env = envFor(7);
    const pucks = env.layout.slots.map(restingPuck);
    const at = { x: pucks[1].hx, y: pucks[1].hy };
    [0, 1, 2].forEach((i, k) => {
      pucks[i].x = at.x + k * 4;
      pucks[i].y = at.y + (k % 2) * 3;
    });
    stepPucks(pucks, 1 / 60, env);
    const apart = env.layout.size + 28;
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [0, 2],
    ]) {
      expect(Math.hypot(pucks[a].x - pucks[b].x, pucks[a].y - pucks[b].y)).toBeGreaterThan(
        // One pass left them at about 0.6 of it, shoving on for frames.
        apart * 0.8,
      );
    }
  });

  it("springs a pushed puck back home", () => {
    const env = envFor(7);
    const pucks = env.layout.slots.map(restingPuck);
    pushFrom(pucks, { x: pucks[0].x + 30, y: pucks[0].y });
    run(pucks, env, 0.1);
    expect(pucks[0].x).toBeLessThan(pucks[0].hx);
    run(pucks, env, 4);
    expect(settled(pucks)).toBe(true);
  });

  it("leans a puck toward heat, a few pixels, and lets it go when the heat fades", () => {
    const env = envFor(7);
    const pucks = env.layout.slots.map(restingPuck);
    const model = { peak: 0.26, scale: 0.12, diffusivity: 4000, lifetime: 1.6 };
    env.pull = [{ sources: [{ x: pucks[0].hx + 30, y: pucks[0].hy, bornAt: 0 }], model }];
    run(pucks, env, 0.3);
    const lean = pucks[0].x - pucks[0].hx;
    expect(lean).toBeGreaterThan(1.5);
    expect(lean).toBeLessThan(20);
    env.pull = [];
    run(pucks, env, 4);
    expect(settled(pucks)).toBe(true);
  });

  it("lets the loop rest while the pointer rests on a puck", () => {
    const env = { ...envFor(7), lifted: 2 };
    const pucks = env.layout.slots.map(restingPuck);
    run(pucks, env, 3);
    expect(pucks[2].s).toBeCloseTo(1.08, 2);
    expect(settled(pucks, 2)).toBe(true);
    expect(settled(pucks)).toBe(false);
  });

  it("does not let a dragged puck sit on another", () => {
    const env = envFor(7);
    const pucks = env.layout.slots.map(restingPuck);
    pucks[0].drag = { x: pucks[1].hx - 10, y: pucks[1].hy };
    run(pucks, env, 0.5);
    expect(Math.hypot(pucks[1].x - pucks[0].x, pucks[1].y - pucks[0].y)).toBeGreaterThanOrEqual(
      env.layout.size,
    );
    expect(pucks[0].x).toBe(pucks[1].hx - 10);
  });
});

describe("neighbour", () => {
  const grid = fieldLayout(7, 1200, true).slots; // 4 over 3

  it("moves along a row and between rows", () => {
    expect(neighbour(grid, 0, "right")).toBe(1);
    expect(neighbour(grid, 1, "left")).toBe(0);
    expect(neighbour(grid, 1, "down")).toBe(4);
    expect(neighbour(grid, 5, "up")).toBe(1);
  });

  it("wraps in reading order at an edge", () => {
    expect(neighbour(grid, 3, "right")).toBe(4);
    expect(neighbour(grid, 0, "left")).toBe(6);
  });
});

describe("moveToSlot", () => {
  it("puts the dropped puck on its new home and moves the ones between along", () => {
    // Four pucks in order; drop the first on the third home.
    expect(moveToSlot([0, 1, 2, 3], 0, 2)).toEqual([2, 0, 1, 3]);
    // And back the other way: the last onto the first home.
    expect(moveToSlot([0, 1, 2, 3], 3, 0)).toEqual([1, 2, 3, 0]);
  });

  it("changes nothing when a puck is dropped on its own home", () => {
    expect(moveToSlot([2, 0, 1, 3], 1, 0)).toEqual([2, 0, 1, 3]);
  });

  it("works from an order already changed", () => {
    // Homes: puck 1 first, then 2, then 0, then 3. Puck 3 to the front.
    expect(moveToSlot([2, 0, 1, 3], 3, 0)).toEqual([3, 1, 2, 0]);
  });
});

describe("nearestSlot", () => {
  it("finds the home nearest a drop", () => {
    const slots = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];
    expect(nearestSlot(slots, { x: 70, y: 20 })).toBe(1);
    expect(nearestSlot(slots, { x: 10, y: 60 })).toBe(2);
  });
});
