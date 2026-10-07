import { describe, expect, it } from "vitest";

import { holdsAtHub } from "./circuit";

describe("holdsAtHub", () => {
  const foot = 2000;
  const stay = 160;

  it("holds a closed circuit while the reader stays near the foot", () => {
    expect(holdsAtHub(true, foot, foot, stay)).toBe(true);
    expect(holdsAtHub(true, foot - 30, foot, stay)).toBe(true);
    expect(holdsAtHub(true, foot - stay, foot, stay)).toBe(true);
  });

  it("lets go once the reader has scrolled clearly back up", () => {
    expect(holdsAtHub(true, foot - stay - 1, foot, stay)).toBe(false);
    expect(holdsAtHub(true, foot - 400, foot, stay)).toBe(false);
  });

  it("never holds a circuit that has not closed", () => {
    expect(holdsAtHub(false, foot, foot, stay)).toBe(false);
    expect(holdsAtHub(false, foot - 30, foot, stay)).toBe(false);
  });
});
