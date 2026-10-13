import { endpoints } from "../config/endpoints";

import { apiClient } from "./apiClient";

export type ApiTestimonial = {
  id: number;
  translations: Record<
    string,
    {
      course?: string;
      content?: string;
    }
  >;
  created_at: string;
  updated_at: string;
  semester: string;
  season: "Winter" | "Spring" | "Summer" | "Fall";
};

export type UiTestimonial = {
  id: number;
  name: string; // We'll generate anonymous names since no name field in API
  course: string;
  semester: string;
  season: string;
  rating: number; // We'll generate ratings since no rating field in API
  text: string;
};

// The season is a fixed English enum on the backend; the Polish academic
// calendar knows two semesters, so autumn and spring fold into them.
const POLISH_SEASON: Record<ApiTestimonial["season"], string> = {
  Winter: "sem. zimowy",
  Fall: "sem. zimowy",
  Spring: "sem. letni",
  Summer: "sem. letni",
};

const seasonLabel = (season: ApiTestimonial["season"], lang: string) =>
  lang === "pl" ? (POLISH_SEASON[season] ?? season) : season;

export function mapApiTestimonialToUi(
  testimonial: ApiTestimonial,
  language: string,
): UiTestimonial {
  const lang = language.toLowerCase();
  const localized = testimonial.translations?.[lang] || testimonial.translations?.["en"] || {};

  // Generate anonymous student names based on ID for consistency
  const studentNames = [
    "Anonymous Student A",
    "Anonymous Student B",
    "Anonymous Student C",
    "Anonymous Student D",
    "Anonymous Student E",
    "Anonymous Student F",
    "Anonymous Student G",
    "Anonymous Student H",
  ];

  // Generate consistent name based on ID
  const name = studentNames[(testimonial.id - 1) % studentNames.length] || "Anonymous Student";

  // Generate consistent rating (4-5 stars) based on ID
  const rating = 4 + (testimonial.id % 2);

  return {
    id: testimonial.id,
    name,
    course: localized.course || "",
    semester: `${seasonLabel(testimonial.season, lang)} ${testimonial.semester}`,
    season: testimonial.season,
    rating,
    text: localized.content || "",
  };
}

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchTestimonials = (): Promise<ApiTestimonial[]> =>
  apiClient.getList<ApiTestimonial[]>(endpoints.education.testimonials.list);
