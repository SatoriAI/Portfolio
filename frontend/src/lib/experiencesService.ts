import { endpoints } from "../config/endpoints";

import { apiClient } from "./apiClient";
import { typeset } from "./typography";

export type ApiExperience = {
  id: number;
  translations: Record<
    string,
    {
      /** The role's title in this language; replaces `position`. */
      role?: string;
      location?: string;
      product?: string | null;
      responsibilities?: string | null;
      contributions?: string[] | null;
      results?: string[] | null;
      /** The old write-up, read only where the new sections are empty. */
      description?: string | null;
      achievements?: string[] | null;
      /** The question its Vex prompt offers; empty for a general one. */
      vex_question?: string;
    }
  >;
  created_at: string;
  updated_at: string;
  /** The old, shared title; read only where `role` is empty. */
  position: string;
  start: string;
  end: string;
  company: string;
  technologies: string[] | null;
  /** Programming tools used in the role (Copilot, Claude Code). */
  tools?: string[] | null;
  /** Subjects taught, for a training role. */
  topics?: string[] | null;
};

export type UiExperience = {
  id: number;
  company: string;
  /** The role's title in the reader's language. */
  role: string;
  period: string;
  /** ISO dates, kept so the timeline can be drawn to scale; `end` is empty while current. */
  start: string;
  end: string;
  location: string;
  /** What the product is. */
  product: string;
  /** What the role was responsible for. */
  responsibilities: string;
  /** Selected contributions, one sentence each. */
  contributions: string[];
  /** What came of the work. */
  results: string[];
  /**
   * The old write-up, kept only where the new one leaves a gap: the old
   * paragraph when neither product nor responsibilities is written, the old
   * achievements when neither contributions nor results are. Each pair covers
   * the same ground, so a role never reads twice.
   */
  description: string;
  achievements: string[];
  /** The question its Vex prompt offers, or empty for a general one. */
  vexQuestion: string;
  technologies: string[];
  tools: string[];
  topics: string[];
};

export function mapApiExperienceToUi(experience: ApiExperience, language: string): UiExperience {
  const lang = language.toLowerCase();
  const localized = experience.translations?.[lang] || experience.translations?.["en"] || {};

  // Format the period from start and end dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.getFullYear().toString();
  };

  const startYear = formatDate(experience.start);
  const presentLabel = lang === "pl" ? "obecnie" : "present";
  const endYear = experience.end ? formatDate(experience.end) : presentLabel;
  // An en dash, closed up: the typographic range, not a hyphen with spaces.
  const period = `${startYear}–${endYear}`;

  // The site's typographic rules (Polish one-letter words) for the prose.
  const set = (text: string) => typeset(text, lang);
  const product = set(localized.product || "");
  const responsibilities = set(localized.responsibilities || "");
  const contributions = (localized.contributions || []).map(set);
  const results = (localized.results || []).map(set);
  const written = Boolean(product || responsibilities);
  const listed = contributions.length > 0 || results.length > 0;

  return {
    id: experience.id,
    company: experience.company || "",
    // A translation added before the role field existed may leave it empty.
    role: localized.role || experience.position || "",
    period,
    start: experience.start || "",
    end: experience.end || "",
    location: localized.location || "",
    product,
    responsibilities,
    contributions,
    results,
    description: written ? "" : set(localized.description || ""),
    achievements: listed ? [] : (localized.achievements || []).map(set),
    vexQuestion: localized.vex_question || "",
    technologies: experience.technologies || [],
    tools: experience.tools || [],
    topics: experience.topics || [],
  };
}

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchExperiences = (): Promise<ApiExperience[]> =>
  apiClient.getList<ApiExperience[]>(endpoints.work.experiences.list);
