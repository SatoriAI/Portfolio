import { describe, expect, it } from "vitest";

import { parseFormula, splitMath } from "./formula";

describe("parseFormula", () => {
  it("reads identifiers, numbers and operators into a row", () => {
    expect(parseFormula("a = 17")).toEqual({
      type: "row",
      children: [
        { type: "id", value: "a" },
        { type: "op", value: "=" },
        { type: "num", value: "17" },
      ],
    });
  });

  it("attaches a single-token subscript and a braced superscript", () => {
    expect(parseFormula("K_t")).toEqual({
      type: "sub",
      base: { type: "id", value: "K" },
      sub: { type: "id", value: "t" },
    });
    const power = parseFormula("e^{2πi}");
    expect(power.type).toBe("sup");
    if (power.type === "sup") expect(power.sup.type).toBe("row");
  });

  it("builds a fraction from two operands", () => {
    const fraction = parseFormula("\\frac{2π · 51}{113}");
    expect(fraction.type).toBe("frac");
    if (fraction.type === "frac") expect(fraction.den).toEqual({ type: "num", value: "113" });
  });

  it("keeps \\text verbatim and reads blackboard letters and kets", () => {
    expect(parseFormula("\\text{mod }113")).toEqual({
      type: "row",
      children: [
        { type: "text", value: "mod\u00A0" },
        { type: "num", value: "113" },
      ],
    });
    expect(parseFormula("ℤ_{113}").type).toBe("sub");
    expect(parseFormula("|0⟩")).toEqual({
      type: "row",
      children: [
        { type: "op", value: "|" },
        { type: "num", value: "0" },
        { type: "op", value: "⟩" },
      ],
    });
  });

  it("rejects notation it does not know rather than mis-rendering it", () => {
    expect(() => parseFormula("a & b")).toThrow(/Unexpected/);
    expect(() => parseFormula("e^{2")).toThrow(/Missing/);
    expect(() => parseFormula("a}")).toThrow(/Unbalanced/);
  });
});

describe("splitMath", () => {
  it("separates inline formulas from prose", () => {
    expect(splitMath("the kernel $K_t(x, y)$ for fixed $y$.")).toEqual([
      { math: false, value: "the kernel " },
      { math: true, value: "K_t(x, y)" },
      { math: false, value: " for fixed " },
      { math: true, value: "y" },
      { math: false, value: "." },
    ]);
  });

  it("leaves an unmatched dollar as text", () => {
    expect(splitMath("costs $5")).toEqual([{ math: false, value: "costs $5" }]);
  });
});
