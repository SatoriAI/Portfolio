import { endpoints } from "../config/endpoints";
import { env } from "../config/env";
import { useSettings } from "../contexts/SettingsContext";

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
    semester: `${testimonial.season} ${testimonial.semester}`,
    season: testimonial.season,
    rating,
    text: localized.content || "",
  };
}

// Mock data for development
const mockTestimonials: ApiTestimonial[] = [
  {
    id: 1,
    translations: {
      en: {
        course: "Advanced Mathematics",
        content:
          "Exceptional teaching style! Complex mathematical concepts were explained clearly and patiently. The practical examples really helped bridge theory and application.",
      },
      pl: {
        course: "Matematyka Zaawansowana",
        content:
          "Wyjątkowy styl nauczania! Złożone koncepcje matematyczne zostały wyjaśnione jasno i cierpliwie. Praktyczne przykłady naprawdę pomogły połączyć teorię z zastosowaniem.",
      },
    },
    created_at: "2023-12-15T00:00:00Z",
    updated_at: "2023-12-15T00:00:00Z",
    semester: "2023/24",
    season: "Fall",
  },
  {
    id: 2,
    translations: {
      en: {
        course: "Linear Algebra",
        content:
          "Best mathematics instructor I've had. The combination of theoretical depth and real-world applications made the subject fascinating and accessible.",
      },
      pl: {
        course: "Algebra Liniowa",
        content:
          "Najlepszy instruktor matematyki, jakiego miałem. Połączenie głębi teoretycznej z zastosowaniami w rzeczywistym świecie sprawiło, że przedmiot był fascynujący i przystępny.",
      },
    },
    created_at: "2023-06-20T00:00:00Z",
    updated_at: "2023-06-20T00:00:00Z",
    semester: "2022/23",
    season: "Spring",
  },
  {
    id: 3,
    translations: {
      en: {
        course: "Mathematical Analysis",
        content:
          "Outstanding mentor and teacher. Always available for questions and provided excellent guidance on research projects. Highly recommend!",
      },
      pl: {
        course: "Analiza Matematyczna",
        content:
          "Wybitny mentor i nauczyciel. Zawsze dostępny na pytania i zapewniał doskonałe wskazówki dotyczące projektów badawczych. Gorąco polecam!",
      },
    },
    created_at: "2022-12-10T00:00:00Z",
    updated_at: "2022-12-10T00:00:00Z",
    semester: "2022/23",
    season: "Winter",
  },
  {
    id: 4,
    translations: {
      en: {
        course: "Topology",
        content:
          "Incredible ability to make abstract concepts concrete. The course materials were well-organized and the explanations were crystal clear.",
      },
      pl: {
        course: "Topologia",
        content:
          "Niesamowita umiejętność konkretyzowania abstrakcyjnych koncepcji. Materiały do kursu były dobrze zorganizowane, a wyjaśnienia były krystalicznie jasne.",
      },
    },
    created_at: "2023-03-15T00:00:00Z",
    updated_at: "2023-03-15T00:00:00Z",
    semester: "2022/23",
    season: "Winter",
  },
];

export async function fetchTestimonials(language: string): Promise<UiTestimonial[]> {
  if (env.mock) {
    // Use mock data when VITE_MOCK=true
    return mockTestimonials.map((t) => mapApiTestimonialToUi(t, language));
  }

  const data = await apiClient.get<ApiTestimonial[]>(endpoints.education.testimonials.list);
  return data.map((t) => mapApiTestimonialToUi(t, language));
}

export function useTestimonials() {
  const { language } = useSettings();
  return { fetch: () => fetchTestimonials(language) };
}
