import { endpoints } from "../config/endpoints";
import { env } from "../config/env";
import { useSettings } from "../contexts/SettingsContext";

import { apiClient } from "./apiClient";

export type ApiPublication = {
  id: number;
  translations: Record<
    string,
    {
      summary?: string;
    }
  >;
  created_at: string;
  updated_at: string;
  title: string;
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
    title: publication.title || "",
    journal: publication.journal || "",
    year: publication.year || new Date().getFullYear(),
    link: publication.link || "",
    summary: localized.summary || "",
  };
}

// Mock data for development
const mockPublications: ApiPublication[] = [
  {
    id: 1,
    translations: {
      en: {
        summary:
          "This paper explores novel applications of algebraic topology methods in high-dimensional data analysis, providing new insights into persistent homology algorithms and their computational efficiency in modern machine learning workflows.",
      },
      pl: {
        summary:
          "Ten artykuł bada nowatorskie zastosowania metod topologii algebraicznej w analizie danych wielowymiarowych, dostarczając nowych spostrzeżeń na temat algorytmów homologii trwałej i ich wydajności obliczeniowej w nowoczesnych przepływach pracy uczenia maszynowego.",
      },
    },
    created_at: "2023-01-15T00:00:00Z",
    updated_at: "2023-01-15T00:00:00Z",
    title: "Advanced Techniques in Algebraic Topology: Applications to Data Analysis",
    journal: "Journal of Mathematical Sciences",
    link: "https://example.com/publications/advanced-algebraic-topology-data-analysis",
    year: 2023,
  },
  {
    id: 2,
    translations: {
      en: {
        summary:
          "We present a comprehensive framework that combines traditional topological methods with modern machine learning techniques, enabling enhanced pattern recognition capabilities in complex datasets through innovative algorithmic approaches.",
      },
      pl: {
        summary:
          "Prezentujemy kompleksowy framework łączący tradycyjne metody topologiczne z nowoczesnymi technikami uczenia maszynowego, umożliwiając zwiększone możliwości rozpoznawania wzorców w złożonych zbiorach danych poprzez innowacyjne podejścia algorytmiczne.",
      },
    },
    created_at: "2023-06-20T00:00:00Z",
    updated_at: "2023-06-20T00:00:00Z",
    title: "Machine Learning Approaches to Topological Data Analysis",
    journal: "International Conference on Mathematical Computing",
    link: "https://example.com/publications/ml-approaches-topological-data-analysis",
    year: 2023,
  },
  {
    id: 3,
    translations: {
      en: {
        summary:
          "A comprehensive review of computational approaches to solving complex algebraic problems, with particular emphasis on algorithmic efficiency, scalability, and practical implementation considerations in modern computing environments.",
      },
      pl: {
        summary:
          "Kompleksowy przegląd podejść obliczeniowych do rozwiązywania złożonych problemów algebraicznych, ze szczególnym naciskiem na wydajność algorytmiczną, skalowalność i praktyczne aspekty implementacji w nowoczesnych środowiskach obliczeniowych.",
      },
    },
    created_at: "2022-11-10T00:00:00Z",
    updated_at: "2022-11-10T00:00:00Z",
    title: "Computational Methods in Modern Algebra",
    journal: "Mathematical Reviews Quarterly",
    link: "https://example.com/publications/computational-methods-modern-algebra",
    year: 2022,
  },
];

export async function fetchPublications(language: string): Promise<UiPublication[]> {
  if (env.mock) {
    // Use mock data when VITE_MOCK=true
    return mockPublications.map((p) => mapApiPublicationToUi(p, language));
  }

  const data = await apiClient.get<ApiPublication[]>(endpoints.education.publications.list);
  return data.map((p) => mapApiPublicationToUi(p, language));
}

export function usePublications() {
  const { language } = useSettings();
  return { fetch: () => fetchPublications(language) };
}
