import { describe, expect, it } from "vitest";

import { domainFor } from "./domainGlyph";

// The titles as the backend serves them, in both languages.
const CONE = {
  link: "https://doi.org/10.1016/j.jat.2023.105921",
  en: "Sharp estimates for Jacobi heat kernels in conic domains",
  pl: "Ostre oszacowania jąder ciepła Jacobiego w przestrzeniach stożkowych",
};
const DOUBLE_CONE = {
  link: "https://arxiv.org/abs/2411.15793",
  en: "Sharp estimates for Jacobi heat kernels in double conic domains",
  pl: "Ostre oszacowania jąder ciepła Jacobiego w podwójnych przestrzeniach stożkowych",
};
const DARCY = {
  link: "https://arxiv.org/abs/2610.20106",
  en: "Emulating the Darcy Solution Operator by Heat-Semigroup Functional Calculus and Pointwise Products",
  pl: "Emulacja operatora rozwiązania równania Darcy’ego za pomocą rachunku funkcyjnego półgrupy ciepła i iloczynów punktowych",
};

describe("domainFor", () => {
  it.each(["en", "pl"] as const)("draws the conic paper as a cone (%s)", (lang) => {
    expect(domainFor({ title: CONE[lang], link: CONE.link })).toBe("cone");
  });

  it.each(["en", "pl"] as const)("draws the double conic paper as a double cone (%s)", (lang) => {
    expect(domainFor({ title: DOUBLE_CONE[lang], link: DOUBLE_CONE.link })).toBe("double-cone");
  });

  // No word in the Darcy paper's title names its domain, in either language,
  // so only its link can find it.
  it.each(["en", "pl"] as const)("draws the Darcy paper as the slab, by its link (%s)", (lang) => {
    expect(domainFor({ title: DARCY[lang], link: DARCY.link })).toBe("darcy");
  });

  it("gives a paper it cannot place no glyph rather than a wrong one", () => {
    expect(domainFor({ title: DARCY.en, link: "https://example.org/other" })).toBeNull();
    expect(domainFor({ title: "A paper on something else", link: "" })).toBeNull();
  });
});
