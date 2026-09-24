import { describe, expect, it } from "vitest";

import {
  applyGate,
  blochVector,
  formatComplex,
  GATES,
  probabilities,
  type Qubit,
  rotate,
  ZERO,
} from "./qubit";

const close = (actual: number[], expected: number[]) =>
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));

const run = (...gates: (keyof typeof GATES)[]): Qubit =>
  gates.reduce((state, name) => applyGate(state, GATES[name]), ZERO);

describe("single-qubit gates", () => {
  it("starts at the north pole", () => {
    close(blochVector(ZERO), [0, 0, 1]);
  });

  it("H takes |0⟩ to |+⟩ and X flips to |1⟩", () => {
    close(blochVector(run("H")), [1, 0, 0]);
    close(blochVector(run("X")), [0, 0, -1]);
  });

  it("H twice is the identity, the interference a visitor can find", () => {
    close(blochVector(run("H", "H")), [0, 0, 1]);
    close(probabilities(run("H", "H")), [1, 0]);
  });

  it("S and T rotate about z: two Ts make an S, two Ss make a Z", () => {
    close(blochVector(run("H", "T", "T")), blochVector(run("H", "S")));
    close(blochVector(run("H", "S", "S")), blochVector(run("H", "Z")));
    close(blochVector(run("H", "S")), [0, 1, 0]);
  });

  it("keeps the state normalised", () => {
    const [p0, p1] = probabilities(run("H", "T", "H", "S", "X"));
    expect(p0 + p1).toBeCloseTo(1, 9);
  });

  it("the Bloch rotation of each gate lands where the matrix does", () => {
    for (const gate of Object.values(GATES)) {
      const before = run("H", "T");
      const after = applyGate(before, gate);
      close(rotate(blochVector(before), gate.axis, gate.angle), blochVector(after));
    }
  });
});

describe("formatComplex", () => {
  it("drops a zero part and typesets the sign", () => {
    expect(formatComplex({ re: 0.7071, im: 0 })).toBe("0.71");
    expect(formatComplex({ re: 0, im: -1 })).toBe("-1.00i");
    expect(formatComplex({ re: 0.5, im: 0.5 })).toBe("0.50 + 0.50i");
    expect(formatComplex({ re: 0.5, im: -0.5 })).toBe("0.50 − 0.50i");
    expect(formatComplex({ re: -0.0001, im: 0 })).toBe("0.00");
  });
});
