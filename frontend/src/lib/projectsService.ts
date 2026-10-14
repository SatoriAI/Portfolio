import { endpoints } from "../config/endpoints";

import { apiClient } from "./apiClient";

export type ApiProject = {
  id: number;
  translations: Record<string, { description?: string; vex_question?: string }>;
  created_at: string;
  updated_at: string;
  title: string;
  image: string;
  tags: string[];
  demo: string;
  repository: string;
  /** A phone app; absent from an API older than the field. */
  mobile?: boolean;
};

export type UiProject = {
  id: number;
  title: string;
  description: string;
  /** The question its Vex prompt offers, or empty for the general one. */
  vexQuestion: string;
  technologies: string[];
  github: string;
  demo: string;
  image: string;
  /** A phone app: shown in a phone rather than a browser window. */
  mobile: boolean;
};

export function mapApiProjectToUi(project: ApiProject, language: string): UiProject {
  const lang = language.toLowerCase();
  const localized = project.translations?.[lang] || project.translations?.["en"] || {};
  const description = localized.description || "";
  return {
    id: project.id,
    title: project.title,
    description,
    vexQuestion: localized.vex_question || "",
    technologies: project.tags || [],
    github: project.repository || "",
    demo: project.demo || "",
    image: project.image || "",
    mobile: project.mobile ?? false,
  };
}

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchProjects = (): Promise<ApiProject[]> =>
  apiClient.getList<ApiProject[]>(endpoints.work.projects.list);
