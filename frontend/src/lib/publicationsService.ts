import { endpoints } from "../config/endpoints";

import { apiClient } from "./apiClient";

export type ApiPublication = {
  id: number;
  translations: Record<
    string,
    {
      summary?: string;
      title?: string;
    }
  >;
  created_at: string;
  updated_at: string;
  title?: string;
  journal: string;
  link: string;
  year: number;
};

export type UiPublication = {
  id: number;
  title: string;
  journal: string;
  year: number;
  link: string;
  summary: string;
};

export function mapApiPublicationToUi(
  publication: ApiPublication,
  language: string,
): UiPublication {
  const lang = language.toLowerCase();
  const localized = publication.translations?.[lang] || publication.translations?.["en"] || {};

  return {
    id: publication.id,
    title: localized.title || publication.title || "",
    journal: publication.journal || "",
    year: publication.year || new Date().getFullYear(),
    link: publication.link || "",
    summary: localized.summary || "",
  };
}

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchPublications = (): Promise<ApiPublication[]> =>
  apiClient.getList<ApiPublication[]>(endpoints.education.publications.list);
