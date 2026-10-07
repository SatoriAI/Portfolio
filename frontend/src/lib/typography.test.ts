import { describe, expect, it } from "vitest";

import { bindOrphans, typeset, typesetDeep } from "./typography";

const NBSP = " ";

describe("bindOrphans", () => {
  it("binds a one-letter word to the word after it", () => {
    expect(bindOrphans("Python w produkcji i doktorat")).toBe(
      `Python w${NBSP}produkcji i${NBSP}doktorat`,
    );
  });

  it("binds at the start of the text and after an opening bracket or quote", () => {
    expect(bindOrphans("W Nokii (i w Xperi)")).toBe(`W${NBSP}Nokii (i${NBSP}w${NBSP}Xperi)`);
  });

  it("leaves longer words and one-letter words at the end alone", () => {
    expect(bindOrphans("na produkcji od 2019")).toBe("na produkcji od 2019");
    expect(bindOrphans("tak czy nie a")).toBe("tak czy nie a");
  });

  it("does not touch a letter inside a word or before punctuation", () => {
    expect(bindOrphans("dane a. b, c")).toBe("dane a. b, c");
  });

  it("is idempotent", () => {
    const once = bindOrphans("w Nokii i w Xperi");
    expect(bindOrphans(once)).toBe(once);
  });
});

describe("typeset", () => {
  it("applies the Polish rule only to Polish", () => {
    expect(typeset("a b", "pl")).toBe(`a${NBSP}b`);
    expect(typeset("a b", "PL")).toBe(`a${NBSP}b`);
    expect(typeset("a b", "en")).toBe("a b");
  });
});

describe("typesetDeep", () => {
  it("reaches strings nested in objects and arrays and keeps everything else", () => {
    const copy = { title: "o mnie", items: ["i tak", { value: 2, label: "z tym" }] };
    expect(typesetDeep(copy, "pl")).toEqual({
      title: `o${NBSP}mnie`,
      items: [`i${NBSP}tak`, { value: 2, label: `z${NBSP}tym` }],
    });
  });
});
