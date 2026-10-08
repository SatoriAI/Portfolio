import { describe, expect, it } from "vitest";

import { formatYears, polishYears } from "./skillYears";

describe("polishYears", () => {
  it("declines the noun by the count", () => {
    expect(polishYears(1)).toBe("rok");
    expect(polishYears(3)).toBe("lata");
    expect(polishYears(5)).toBe("lat");
    expect(polishYears(10)).toBe("lat");
    expect(polishYears(12)).toBe("lat");
    expect(polishYears(22)).toBe("lata");
  });
});

describe("formatYears", () => {
  it("formats per language", () => {
    expect(formatYears(10, "en")).toBe("10+ yrs");
    expect(formatYears(3, "pl")).toBe("3+ lata");
    expect(formatYears(5, "PL")).toBe("5+ lat");
  });

  it("says under a year rather than 0+", () => {
    expect(formatYears(0, "en")).toBe("<1 yr");
    expect(formatYears(0, "pl")).toBe("<1 rok");
  });
});
