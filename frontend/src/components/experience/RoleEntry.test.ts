import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { mapApiExperienceToUi } from "@/lib/experiencesService";

import RoleEntry, { type RoleEntryLabels } from "./RoleEntry";

const LABELS: RoleEntryLabels = {
  technologies: "Technologie",
  tools: "Narzędzia",
  topics: "Tematy",
  product: "Produkt",
  responsibilities: "Odpowiedzialność",
  contributions: "Wkład",
  results: "Rezultaty",
  keyAchievements: "Osiągnięcia",
  askVex: "zapytaj Vex o {company}",
  askVexQuestions: ["Co robił w {company}?"],
};

describe("RoleEntry", () => {
  it("lists the technologies as the page's language names them", () => {
    const experience = mapApiExperienceToUi(
      {
        id: 1,
        translations: { pl: { role: "Inżynier", location: "Online" } },
        created_at: "",
        updated_at: "",
        position: "",
        start: "2022-01-01",
        end: "",
        company: "Kelvinbrook",
        technologies: ["Python", "Microservices"],
        technologies_display: { en: ["Python", "Microservices"], pl: ["Python", "Mikroserwisy"] },
      },
      "pl",
    );
    const html = renderToString(
      createElement(RoleEntry, { experience, order: 0, labels: LABELS, onAsk: () => {} }),
    );
    expect(html).toContain("Mikroserwisy");
    expect(html).not.toContain("Microservices");
  });
});
