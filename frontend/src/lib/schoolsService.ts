import { endpoints } from "../config/endpoints";
import { env } from "../config/env";

import { apiFetch } from "./apiClient";

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

// The degree is an untranslated field on the backend; these are the values it
// holds today, named the way the site names them. Anything else passes
// through unchanged. The doctorate is "Doktorat" / "PhD" everywhere, never
// "Studia doktoranckie", so the page and the site's descriptions agree.
const DEGREE_NAMES: Record<string, Record<string, string>> = {
  pl: {
    "Bachelor's": "Licencjat",
    "Master's": "Magisterium",
    "Doctoral Studies": "Doktorat",
    PhD: "Doktorat",
    MSc: "Magisterium",
  },
  en: { "Doctoral Studies": "PhD" },
};

const IN_PROGRESS: Record<string, string> = { pl: "w toku", en: "in progress" };

/**
 * A degree's name in the language, marked as in progress while it has no end
 * date, so a doctorate still under way never reads as one already awarded.
 */
export const degreeLabel = (degree: string, lang: string, ongoing: boolean) => {
  const name = DEGREE_NAMES[lang]?.[degree] ?? degree;
  const note = IN_PROGRESS[lang] ?? IN_PROGRESS.en;
  return ongoing && name ? `${name} (${note})` : name;
};

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
    degree: degreeLabel(school.degree || "", lang, !school.end),
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
    degree: "PhD",
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
    degree: "MSc",
  },
];

export async function fetchSchools(language: string): Promise<UiSchool[]> {
  if (env.mock) {
    // Use mock data when VITE_MOCK=true
    return mockSchools.map((s) => mapApiSchoolToUi(s, language));
  }

  const data = await apiFetch<ApiSchool[]>(endpoints.education.schools.list, {
    method: "GET",
    headers: { "Accept-Language": language },
  });
  return data.map((s) => mapApiSchoolToUi(s, language));
}
