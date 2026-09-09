import { Brain, Code } from "lucide-react";
import { describe, expect, it } from "vitest";

import { ApiSkill, mapApiSkillToUi } from "./skillsService";

// Localisation lives in the backend's parler translations rather than in an i18n
// library here, so this mapping is the whole of the frontend's language handling
// for skills. Its fallbacks are worth pinning.
const skill = (translations: ApiSkill["translations"]): ApiSkill => ({
  id: 1,
  translations,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  level: "Advanced",
  icon: "Brain",
});

describe("mapApiSkillToUi", () => {
  const bilingual = skill({
    en: { name: "Python", description: "Backend systems" },
    pl: { name: "Python", description: "Systemy backendowe" },
  });

  it("uses the requested language", () => {
    expect(mapApiSkillToUi(bilingual, "pl").description).toBe("Systemy backendowe");
  });

  it("matches the language case-insensitively", () => {
    expect(mapApiSkillToUi(bilingual, "PL").description).toBe("Systemy backendowe");
  });

  it("falls back to English when the requested language is missing", () => {
    const englishOnly = skill({ en: { name: "Python", description: "Backend systems" } });
    expect(mapApiSkillToUi(englishOnly, "pl").description).toBe("Backend systems");
  });

  it("yields empty strings rather than undefined when no translation exists", () => {
    const untranslated = mapApiSkillToUi(skill({}), "pl");
    expect(untranslated.name).toBe("");
    expect(untranslated.description).toBe("");
  });

  it("carries the level through untouched", () => {
    expect(mapApiSkillToUi(bilingual, "en").level).toBe("Advanced");
  });

  it("maps the icon name to its component", () => {
    expect(mapApiSkillToUi(bilingual, "en").icon).toBe(Brain);
  });

  // The backend's Icons choices and this map can drift apart; a new choice must
  // not render nothing.
  it("falls back to the Code icon for an unrecognised name", () => {
    const unknown = { ...bilingual, icon: "Sparkles" } as unknown as ApiSkill;
    expect(mapApiSkillToUi(unknown, "en").icon).toBe(Code);
  });
});
