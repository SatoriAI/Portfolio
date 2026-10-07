import { endpoints } from "../config/endpoints";
import { env } from "../config/env";

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
    return date.getFullYear().toString();
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

// Mock data for development
const mockSchools: ApiSchool[] = [
  {
    id: 1,
    translations: {
      en: {
        study: "PhD in Theoretical Mathematics",
        university: "Wrocław University of Technology",
        research:
          "Algebraic Topology and Applications to Data Analysis - Developing novel computational methods for topological data analysis and persistent homology with applications in machine learning and data science.",
        advisor: "prof. Adam Nowak",
        areas: [
          "Algebraic Topology",
          "Topological Data Analysis",
          "Computational Mathematics",
          "Machine Learning Theory",
          "Persistent Homology",
        ],
      },
      pl: {
        study: "Doktorat z Matematyki Teoretycznej",
        university: "Politechnika Wrocławska",
        research:
          "Topologia Algebraiczna i Zastosowania w Analizie Danych - Opracowywanie nowatorskich metod obliczeniowych dla topologicznej analizy danych i homologii trwałej z zastosowaniami w uczeniu maszynowym i nauce o danych.",
        advisor: "prof. Adam Nowak",
        areas: [
          "Topologia Algebraiczna",
          "Topologiczna Analiza Danych",
          "Matematyka Obliczeniowa",
          "Teoria Uczenia Maszynowego",
          "Homologia Trwała",
        ],
      },
    },
    created_at: "2021-10-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    start: "2021-10-01",
    end: "",
    degree: "Doctoral Studies",
  },
  {
    id: 2,
    translations: {
      en: {
        study: "Master of Science in Mathematics",
        university: "Wrocław University of Technology",
        research:
          "Harmonic Analysis and Functional Analysis - Research focused on operator theory and spectral analysis with applications to signal processing.",
        advisor: "prof. dr hab. Maria Kowalska",
        areas: ["Harmonic Analysis", "Functional Analysis", "Operator Theory", "Signal Processing"],
      },
      pl: {
        study: "Magister Matematyki",
        university: "Politechnika Wrocławska",
        research:
          "Analiza Harmoniczna i Analiza Funkcjonalna - Badania skupione na teorii operatorów i analizie spektralnej z zastosowaniami w przetwarzaniu sygnałów.",
        advisor: "prof. dr hab. Maria Kowalska",
        areas: [
          "Analiza Harmoniczna",
          "Analiza Funkcjonalna",
          "Teoria Operatorów",
          "Przetwarzanie Sygnałów",
        ],
      },
    },
    created_at: "2016-10-01T00:00:00Z",
    updated_at: "2021-06-30T00:00:00Z",
    start: "2016-10-01",
    end: "2021-06-30",
    degree: "Master's",
  },
];

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchSchools = (): Promise<ApiSchool[]> =>
  env.mock
    ? Promise.resolve(mockSchools)
    : apiClient.getList<ApiSchool[]>(endpoints.education.schools.list);
