import { describe, expect, it } from "vitest";

import { formatYears, parseYears, polishYears } from "./skillYears";

describe("parseYears", () => {
  it("reads the leading number out of the backend's level text", () => {
    expect(parseYears("10+ years of experience")).toBe(10);
    expect(parseYears("3+ years of experience")).toBe(3);
    expect(parseYears("5 years")).toBe(5);
  });

  it("returns null for a level that is not a count", () => {
    expect(parseYears("Expert")).toBeNull();
    expect(parseYears("")).toBeNull();
    expect(parseYears("0+ years")).toBeNull();
  });
});

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
});
