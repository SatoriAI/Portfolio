import { describe, expect, it } from "vitest";

import { type ApiExperience, mapApiExperienceToUi } from "./experiencesService";

const role = (
  translations: ApiExperience["translations"],
  extra: Partial<ApiExperience> = {},
): ApiExperience => ({
  id: 1,
  translations,
  created_at: "",
  updated_at: "",
  position: "Python Developer",
  start: "2024-04-01",
  end: "",
  company: "CloudFerro",
  technologies: ["Python"],
  ...extra,
});

describe("mapApiExperienceToUi", () => {
  it("reads the new sections in the reader's language", () => {
    const ui = mapApiExperienceToUi(
      role(
        {
          pl: {
            role: "Inżynier backendu",
            location: "Online",
            product: "Platforma chmurowa",
            responsibilities: "Usługi i API",
            contributions: ["Projekt API, potem importer"],
            results: ["Szybsze wdrożenia"],
          },
        },
        { tools: ["Claude Code"], topics: null },
      ),
      "pl",
    );
    expect(ui.role).toBe("Inżynier backendu");
    expect(ui.product).toBe("Platforma chmurowa");
    expect(ui.responsibilities).toBe("Usługi i\u00a0API");
    expect(ui.contributions).toEqual(["Projekt API, potem importer"]);
    expect(ui.results).toEqual(["Szybsze wdrożenia"]);
    expect(ui.tools).toEqual(["Claude Code"]);
    expect(ui.topics).toEqual([]);
  });

  it("binds Polish one-letter words to the next, as the site does everywhere", () => {
    const ui = mapApiExperienceToUi(
      role({ pl: { location: "Online", product: "Dane z obserwacji Ziemi, w tym zdjęcia" } }),
      "pl",
    );
    expect(ui.product).toBe("Dane z\u00a0obserwacji Ziemi, w\u00a0tym zdjęcia");
  });

  it("falls back to the shared position while the role is empty", () => {
    const ui = mapApiExperienceToUi(role({ en: { role: "", location: "Warsaw" } }), "en");
    expect(ui.role).toBe("Python Developer");
  });

  it("keeps the old write-up only where the new one leaves a gap", () => {
    const old = mapApiExperienceToUi(
      role({
        en: { location: "Warsaw", description: "Old paragraph", achievements: ["Old point"] },
      }),
      "en",
    );
    expect(old.description).toBe("Old paragraph");
    expect(old.achievements).toEqual(["Old point"]);

    const rewritten = mapApiExperienceToUi(
      role({
        en: {
          location: "Warsaw",
          responsibilities: "New paragraph",
          results: ["New result"],
          description: "Old paragraph",
          achievements: ["Old point"],
        },
      }),
      "en",
    );
    expect(rewritten.description).toBe("");
    expect(rewritten.achievements).toEqual([]);
  });

  it("judges the old paragraph and the old points apart", () => {
    const old = { description: "Old paragraph", achievements: ["Old point"] };
    const resultsOnly = mapApiExperienceToUi(
      role({ en: { location: "Warsaw", results: ["New result"], ...old } }),
      "en",
    );
    expect(resultsOnly.description).toBe("Old paragraph");
    expect(resultsOnly.achievements).toEqual([]);

    const productOnly = mapApiExperienceToUi(
      role({ en: { location: "Warsaw", product: "New product", ...old } }),
      "en",
    );
    expect(productOnly.description).toBe("");
    expect(productOnly.achievements).toEqual(["Old point"]);
  });

  it("reads English where the reader's language has no translation", () => {
    const ui = mapApiExperienceToUi(
      role({ en: { role: "Backend engineer", location: "Warsaw", results: ["Faster deploys"] } }),
      "pl",
    );
    expect(ui.role).toBe("Backend engineer");
    expect(ui.results).toEqual(["Faster deploys"]);
  });

  it("reads a role from the API before tools and topics existed", () => {
    const ui = mapApiExperienceToUi(role({ en: { location: "Warsaw" } }), "en");
    expect(ui.tools).toEqual([]);
    expect(ui.topics).toEqual([]);
  });

  it("carries the role's own Vex question, or none", () => {
    const own = mapApiExperienceToUi(
      role({ pl: { location: "Online", vex_question: "Jak wyglądał pipeline w Argo?" } }),
      "pl",
    );
    expect(own.vexQuestion).toBe("Jak wyglądał pipeline w Argo?");
    expect(mapApiExperienceToUi(role({ en: { location: "Warsaw" } }), "en").vexQuestion).toBe("");
  });
});
