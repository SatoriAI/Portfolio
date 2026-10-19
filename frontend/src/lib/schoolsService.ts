import { endpoints } from "../config/endpoints";

import { apiClient } from "./apiClient";

export type ApiSchool = {
  id: number;
  translations: Record<
    string,
    {
      study?: string;
      university?: string;
      research?: string;
      advisor?: string;
      areas?: string | string[];
    }
  >;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  degree?: string;
};

export type UiSchool = {
  id: number;
  study: string;
  university: string;
  degree: string;
  research: string;
  advisor: string;
  areas: string[];
  period: string;
  startDate: string;
  endDate: string;
};

// The degree is a choice on the backend, fetched in English (see
// apiClient.getList); these are the values it holds today, named the way the
// site names them. Anything else passes through unchanged. Whether a degree
// is still under way is said once, by its period ("2022–obecnie").
const DEGREE_NAMES: Record<string, Record<string, string>> = {
  pl: {
    "Bachelor's": "Studia licencjackie",
    "Master's": "Studia magisterskie",
    "Doctoral Studies": "Studia doktoranckie",
  },
  en: { "Doctoral Studies": "PhD" },
};

/** A degree's name in the language. */
export const degreeLabel = (degree: string, lang: string) => DEGREE_NAMES[lang]?.[degree] ?? degree;

export function mapApiSchoolToUi(school: ApiSchool, language: string): UiSchool {
  const lang = language.toLowerCase();
  const localized = school.translations?.[lang] || school.translations?.["en"] || {};

  // Format the period from start and end dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.getUTCFullYear().toString();
  };

  const startYear = formatDate(school.start);
  const presentLabel = lang === "pl" ? "obecnie" : "present";
  const endYear = school.end ? formatDate(school.end) : presentLabel;
  // An en dash, closed up: the typographic range, not a hyphen with spaces.
  const period = `${startYear}–${endYear}`;

  // Handle areas - can be string or array
  let areas: string[] = [];
  if (localized.areas) {
    if (Array.isArray(localized.areas)) {
      areas = localized.areas;
    } else if (typeof localized.areas === "string") {
      // If it's a string, try to split by common delimiters or treat as single item
      areas = localized.areas.includes(",")
        ? localized.areas.split(",").map((area) => area.trim())
        : [localized.areas];
    }
  }

  return {
    id: school.id,
    study: localized.study || "",
    university: localized.university || "",
    degree: degreeLabel(school.degree || "", lang),
    research: localized.research || "",
    advisor: localized.advisor || "",
    areas,
    period,
    startDate: school.start,
    endDate: school.end || "",
  };
}

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchSchools = (): Promise<ApiSchool[]> =>
  apiClient.getList<ApiSchool[]>(endpoints.education.schools.list);
