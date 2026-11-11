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

  it("leaves a formula followed by a word as it is", () => {
    expect(prose("o oczku $h$ funkcje")).not.toContain("whitespace-nowrap");
  });
});
