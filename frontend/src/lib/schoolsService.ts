import { endpoints } from "../config/endpoints";
import { env } from "../config/env";
import { useSettings } from "../contexts/SettingsContext";

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
};

export type UiSchool = {
  id: number;
  study: string;
  university: string;
  research: string;
  advisor: string;
  areas: string[];
  period: string;
  startDate: string;
  endDate: string;
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
  const endYear = school.end ? formatDate(school.end) : "Present";
  const period = `${startYear} - ${endYear}`;

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
  },
];

export async function fetchSchools(language: string): Promise<UiSchool[]> {
  if (env.mock) {
    // Use mock data when VITE_MOCK=true
    return mockSchools.map((s) => mapApiSchoolToUi(s, language));
  }

  const data = await apiClient.get<ApiSchool[]>(endpoints.education.schools.list);
  return data.map((s) => mapApiSchoolToUi(s, language));
}

export function useSchools() {
  const { language } = useSettings();
  return { fetch: () => fetchSchools(language) };
}
