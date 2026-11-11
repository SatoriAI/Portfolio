import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Formula, MathText } from "./Formula";

const formula = (tex: string) => renderToStaticMarkup(createElement(Formula, { tex }));
const prose = (text: string) => renderToStaticMarkup(createElement(MathText, { text }));

describe("Formula", () => {
  it("lets the brackets around a fraction grow to its height", () => {
    const html = formula("\\frac{4}{π}(\\frac{1}{4} − \\frac{1}{π^2}) h");
    expect(html).toContain('<mo lspace="0" rspace="0">(</mo>');
    expect(html).toContain('<mo lspace="0" rspace="0">)</mo>');
  });

  it("grows a closing bracket that carries a power, and pairs it with its own opener", () => {
    const html = formula("((\\frac{a}{b})^2 + c)");
    const fences = [...html.matchAll(/<mo([^>]*)>([()])<\/mo>/g)].map(
      ([, attributes, fence]) => `${fence}${attributes.includes("stretchy") ? " short" : " tall"}`,
    );
    // The inner pair holds the fraction itself; the outer pair holds it too.
    expect(fences).toEqual(["( tall", "( tall", ") tall", ") tall"]);
  });

  it("grows only the pair around the fraction", () => {
    const html = formula("(a)(\\frac{1}{2})(b)");
    const fences = [...html.matchAll(/<mo([^>]*)>([()])<\/mo>/g)].map(([, attributes]) =>
      attributes.includes("stretchy") ? "short" : "tall",
    );
    expect(fences).toEqual(["short", "short", "tall", "tall", "short", "short"]);
  });

  it("keeps the brackets of a plain argument at the height of the line", () => {
    const html = formula("K_t(x, y)");
    expect(html).toContain('<mo stretchy="false" lspace="0" rspace="0">(</mo>');
    expect(html).toContain('<mo stretchy="false" lspace="0" rspace="0">)</mo>');
  });
});

describe("MathText", () => {
  it("keeps the punctuation after a formula on the formula's line", () => {
    const html = prose("rzędu $1/h$, bo fala");
    expect(html).toMatch(/<span class="whitespace-nowrap"><math.*<\/math>,<\/span> bo fala$/);
  });

  it("keeps a full stop after the last formula, and a bracket with its stop", () => {
    expect(prose("o oczku $h$.")).toMatch(/<\/math>\.<\/span>$/);
    expect(prose("(czyli $2/h$).")).toMatch(/<\/math>\)\.<\/span>$/);
  });

  it("takes no punctuation from a second formula", () => {
    const html = prose("$x$$.5$ z");
    expect(html).not.toContain("whitespace-nowrap");
    expect(html.match(/<mo>\.<\/mo>/g)).toHaveLength(1);
  });

  it("leaves a formula followed by a word as it is", () => {
    expect(prose("o oczku $h$ funkcje")).not.toContain("whitespace-nowrap");
  });
});
