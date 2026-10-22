import { endpoints } from "../config/endpoints";

import { apiClient } from "./apiClient";
import type { SkillCategory } from "./skillGroups";
import { type SkillIcon, skillIcon } from "./skillIcon";
import { typeset } from "./typography";

export type ApiSkill = {
  id: number;
  translations: Record<string, { name?: string; description?: string }>;
  created_at: string;
  updated_at: string;
  /** The year it was first used, where that came before its first role. */
  since: number | null;
  /** Used since it came out: said instead of a count of years. */
  since_launch: boolean;
  /** One of the backend's Icons choices; lib/skillIcon draws it. */
  icon: string;
  /** Its place within its category. */
  order: number;
  /** The group it is shown in; none, and it is shown after them all. */
  category: {
    id: number;
    order: number;
    translations: Record<string, { name?: string }>;
  } | null;
  /** The technologies that prove it, as roles and projects name them. */
  proven_by: string[];
};

export type UiSkill = {
  /** The backend's id: stable across languages, unlike the name. */
  id: number;
  icon: SkillIcon;
  name: string;
  since: number | null;
  sinceLaunch: boolean;
  description: string;
  order: number;
  category: SkillCategory | null;
  provenBy: readonly string[];
};

export function mapApiSkillToUi(skill: ApiSkill, language: string): UiSkill {
  const lang = language.toLowerCase();
  const localized = skill.translations?.[lang] || skill.translations?.["en"] || {};
  return {
    id: skill.id,
    icon: skillIcon(skill.icon),
    name: localized.name || "",
    since: skill.since ?? null,
    sinceLaunch: skill.since_launch ?? false,
    description: localized.description || "",
    order: skill.order ?? 0,
    category: skill.category
      ? {
          id: skill.category.id,
          order: skill.category.order,
          name: typeset(
            (skill.category.translations[lang] || skill.category.translations["en"])?.name || "",
            lang,
          ),
        }
      : null,
    provenBy: skill.proven_by ?? [],
  };
}

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchSkills = (): Promise<ApiSkill[]> =>
  apiClient.getList<ApiSkill[]>(endpoints.work.skills.list);
