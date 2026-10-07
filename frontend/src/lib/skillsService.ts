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
  level: string;
  icon: "Code" | "Brain" | "Server" | "Database" | "Cloud" | "Container" | "Sparkles" | "Boxes";
};

/** Anything that draws a skill's icon: a Lucide icon, or a brand mark. */
export type SkillIcon = ComponentType<{ className?: string }>;

export type UiSkill = {
  /** The backend's id: stable across languages, unlike the name. */
  id: number;
  icon: SkillIcon;
  name: string;
  level: string;
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
    level: skill.level || "",
    description: localized.description || "",
  };
}

/** Shown in mock mode, where there is no backend; ids match skillEvidence. */
const mockSkills: UiSkill[] = [
  {
    id: 1,
    icon: Code,
    name: "Python",
    level: "10+ years of experience",
    description: "Backend development, APIs, automation",
  },
  {
    id: 2,
    icon: Database,
    name: "PostgreSQL",
    level: "5+ years of experience",
    description: "Schemas, queries, migrations",
  },
  {
    id: 5,
    icon: Brain,
    name: "LLMs & RAG",
    level: "3+ years of experience",
    description: "Pipeline development, vector databases",
  },
  {
    id: 6,
    icon: Server,
    name: "Kubernetes",
    level: "3+ years of experience",
    description: "Helm, deployments, services",
  },
];

export async function fetchSkills(language: string): Promise<UiSkill[]> {
  if (env.mock) return mockSkills;
  const data = await apiClient.get<ApiSkill[]>(endpoints.work.skills.list);
  return data.map((s) => mapApiSkillToUi(s, language));
}
