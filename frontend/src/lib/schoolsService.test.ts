import { describe, expect, it } from "vitest";

import { degreeLabel } from "./schoolsService";

describe("degreeLabel", () => {
  it("names the doctorate the same way on every page", () => {
    expect(degreeLabel("Doctoral Studies", "pl", false)).toBe("Doktorat");
    expect(degreeLabel("Doctoral Studies", "en", false)).toBe("PhD");
  });

  it("marks a degree without an end date as in progress", () => {
    expect(degreeLabel("Doctoral Studies", "pl", true)).toBe("Doktorat (w toku)");
    expect(degreeLabel("Doctoral Studies", "en", true)).toBe("PhD (in progress)");
  });

  it("passes a degree it does not know through unchanged", () => {
    expect(degreeLabel("Master's", "en", false)).toBe("Master's");
    expect(degreeLabel("Habilitation", "pl", false)).toBe("Habilitation");
  });
});
