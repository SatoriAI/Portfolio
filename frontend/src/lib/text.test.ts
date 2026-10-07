import { describe, expect, it } from "vitest";

import { fillTemplate, formatCounter, pad2, splitLastWord } from "./text";

describe("text", () => {
  it("pads to two digits", () => {
    expect(pad2(3)).toBe("03");
    expect(pad2(12)).toBe("12");
  });

  it("formats a counter", () => {
    expect(formatCounter(1, 4)).toBe("01 / 04");
  });

  it("fills every slot, numbers included, and leaves unknown ones", () => {
    expect(fillTemplate("{n} min · {n}", { n: 4 })).toBe("4 min · 4");
    expect(fillTemplate("From {from} to {to}", { from: "a", to: "b" })).toBe("From a to b");
    expect(fillTemplate("Ask about {title}", {})).toBe("Ask about {title}");
  });

  it("cuts a line before its last word", () => {
    expect(splitLastWord("Kiedy sieć odkrywa zegar")).toEqual(["Kiedy sieć odkrywa ", "zegar"]);
    expect(splitLastWord("Słowo")).toEqual(["", "Słowo"]);
  });
});
