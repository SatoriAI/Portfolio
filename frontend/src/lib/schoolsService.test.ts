import { describe, expect, it } from "vitest";

import { degreeLabel } from "./schoolsService";

describe("degreeLabel", () => {
  it("names the degrees the backend holds, in either language", () => {
    expect(degreeLabel("Doctoral Studies", "pl")).toBe("Studia doktoranckie");
    expect(degreeLabel("Bachelor's", "pl")).toBe("Studia licencjackie");
    expect(degreeLabel("Master's", "pl")).toBe("Studia magisterskie");
    expect(degreeLabel("Doctoral Studies", "en")).toBe("PhD");
  });

  it("passes a degree it does not know through unchanged", () => {
    expect(degreeLabel("Master's", "en")).toBe("Master's");
    expect(degreeLabel("Habilitation", "pl")).toBe("Habilitation");
  });
});
