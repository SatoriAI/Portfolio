import { endpoints } from "../config/endpoints";
import { useSettings } from "../contexts/SettingsContext";

import { apiClient } from "./apiClient";

export type ApiProject = {
  id: number;
  translations: Record<string, { description?: string }>;
  created_at: string;
  updated_at: string;
  title: string;
  image: string;
  tags: string[];
  demo: string;
  repository: string;
};

export type UiProject = {
  title: string;
  description: string;
  technologies: string[];
  github: string;
  demo: string;
  image: string;
};

export function mapApiProjectToUi(project: ApiProject, language: string): UiProject {
  const lang = language.toLowerCase();
  const localized = project.translations?.[lang] || project.translations?.["en"] || {};
  const description = localized.description || "";
  return {
    title: project.title,
    description,
    technologies: project.tags || [],
    github: project.repository || "",
    demo: project.demo || "",
    image: project.image || "",
  };
}

export async function fetchProjects(language: string): Promise<UiProject[]> {
  const data = await apiClient.get<ApiProject[]>(endpoints.work.projects.list);
  return data.map((p) => mapApiProjectToUi(p, language));
}

// Optional React hook for convenience
export function useProjects() {
  const { language } = useSettings();
  return { fetch: () => fetchProjects(language) };
}
