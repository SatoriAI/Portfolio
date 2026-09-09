import { Brain, Code, Database, LucideIcon, Server } from "lucide-react";

import { endpoints } from "../config/endpoints";
import { useSettings } from "../contexts/SettingsContext";

import { apiClient } from "./apiClient";

export type ApiSkill = {
  id: number;
  translations: Record<string, { name?: string; description?: string }>;
  created_at: string;
  updated_at: string;
  level: string;
  icon: "Code" | "Brain" | "Server" | "Database";
};

export type UiSkill = {
  icon: LucideIcon;
  name: string;
  level: string;
  description: string;
};

const iconMap: Record<ApiSkill["icon"], LucideIcon> = {
  Code,
  Brain,
  Server,
  Database,
};

export function mapApiSkillToUi(skill: ApiSkill, language: string): UiSkill {
  const lang = language.toLowerCase();
  const localized = skill.translations?.[lang] || skill.translations?.["en"] || {};
  const Icon = iconMap[skill.icon] || Code;
  return {
    icon: Icon,
    name: localized.name || "",
    level: skill.level || "",
    description: localized.description || "",
  };
}

export async function fetchSkills(language: string): Promise<UiSkill[]> {
  const data = await apiClient.get<ApiSkill[]>(endpoints.work.skills.list);
  return data.map((s) => mapApiSkillToUi(s, language));
}

export function useSkills() {
  const { language } = useSettings();
  return { fetch: () => fetchSkills(language) };
}
