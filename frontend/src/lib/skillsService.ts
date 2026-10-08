import type { ComponentType } from "react";
import {
  Boxes,
  Brain,
  Cloud,
  Code,
  Container,
  Database,
  LucideIcon,
  Server,
  Sparkles,
} from "lucide-react";

import { endpoints } from "../config/endpoints";
import { env } from "../config/env";

import { apiClient } from "./apiClient";

export type ApiSkill = {
  id: number;
  translations: Record<string, { name?: string; description?: string }>;
  created_at: string;
  updated_at: string;
  /** The year it was first used, where that came before its first role. */
  since: number | null;
  /** Used since it came out: said instead of a count of years. */
  since_launch: boolean;
  icon: "Code" | "Brain" | "Server" | "Database" | "Cloud" | "Container" | "Sparkles" | "Boxes";
};

/** Anything that draws a skill's icon: a Lucide icon, or a brand mark. */
export type SkillIcon = ComponentType<{ className?: string }>;

export type UiSkill = {
  /** The backend's id: stable across languages, unlike the name. */
  id: number;
  icon: SkillIcon;
  name: string;
  since: number | null;
  sinceLaunch: boolean;
  description: string;
};

// Mirrors work.choices.Icons in the backend; unknown names fall back to Code.
const iconMap: Record<ApiSkill["icon"], LucideIcon> = {
  Code,
  Brain,
  Server,
  Database,
  Cloud,
  Container,
  Sparkles,
  Boxes,
};

export function mapApiSkillToUi(skill: ApiSkill, language: string): UiSkill {
  const lang = language.toLowerCase();
  const localized = skill.translations?.[lang] || skill.translations?.["en"] || {};
  const Icon = iconMap[skill.icon] || Code;
  return {
    id: skill.id,
    icon: Icon,
    name: localized.name || "",
    since: skill.since ?? null,
    sinceLaunch: skill.since_launch ?? false,
    description: localized.description || "",
  };
}

/** Shown in mock mode, where there is no backend; ids match skillEvidence. */
const mockSkill = (
  id: number,
  icon: ApiSkill["icon"],
  name: string,
  since: number | null,
  description: string,
): ApiSkill => ({
  id,
  icon,
  since,
  since_launch: false,
  translations: { en: { name, description } },
  created_at: "",
  updated_at: "",
});
const mockSkills: ApiSkill[] = [
  mockSkill(1, "Code", "Python", 2016, "Backend development, APIs, automation"),
  mockSkill(2, "Database", "PostgreSQL", null, "Schemas, queries, migrations"),
  mockSkill(5, "Brain", "LLMs & RAG", null, "Pipeline development, vector databases"),
  mockSkill(6, "Server", "Kubernetes", null, "Helm, deployments, services"),
];

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchSkills = (): Promise<ApiSkill[]> =>
  env.mock
    ? Promise.resolve(mockSkills)
    : apiClient.getList<ApiSkill[]>(endpoints.work.skills.list);
