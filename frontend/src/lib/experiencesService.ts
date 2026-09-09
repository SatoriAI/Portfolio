import { endpoints } from "../config/endpoints";
import { env } from "../config/env";
import { useSettings } from "../contexts/SettingsContext";

import { apiFetch } from "./apiClient";

export type ApiExperience = {
  id: number;
  translations: Record<
    string,
    {
      location?: string;
      description?: string;
      achievements?: string[];
    }
  >;
  created_at: string;
  updated_at: string;
  position: string;
  start: string;
  end: string;
  company: string;
  technologies: string[];
};

export type UiExperience = {
  id: number;
  company: string;
  position: string;
  period: string;
  location: string;
  description: string;
  achievements: string[];
  technologies: string[];
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
  const presentLabel = lang === "pl" ? "Obecnie" : "Present";
  const endYear = experience.end ? formatDate(experience.end) : presentLabel;
  const period = `${startYear} - ${endYear}`;

  return {
    id: experience.id,
    company: experience.company || "",
    position: experience.position || "",
    period,
    location: localized.location || "",
    description: localized.description || "",
    achievements: localized.achievements || [],
    technologies: experience.technologies || [],
  };
}

// Mock data for development
const mockExperiences: ApiExperience[] = [
  {
    id: 1,
    translations: {
      en: {
        location: "Remote",
        description:
          "Leading the development of scalable microservices architecture handling 2M+ daily requests. Implemented advanced RAG pipelines for document processing and LLM integrations.",
        achievements: [
          "Architected and deployed ML-powered document analysis system",
          "Reduced API response time by 40% through optimization",
          "Led team of 5 developers in agile environment",
          "Implemented comprehensive testing strategy increasing coverage to 95%",
        ],
      },
      pl: {
        location: "Zdalnie",
        description:
          "Kierowanie rozwojem skalowalnej architektury mikrousług obsługującej ponad 2 mln zapytań dziennie. Implementacja zaawansowanych potoków RAG do przetwarzania dokumentów i integracji LLM.",
        achievements: [
          "Zaprojektowanie i wdrożenie systemu analizy dokumentów opartego na ML",
          "Redukcja czasu odpowiedzi API o 40% poprzez optymalizację",
          "Kierowanie zespołem 5 deweloperów w środowisku agile",
          "Implementacja kompleksowej strategii testowej zwiększającej pokrycie do 95%",
        ],
      },
    },
    created_at: "2022-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    position: "Senior Python Backend Developer",
    start: "2022-01-01",
    end: "",
    company: "Tech Innovate Corp",
    technologies: ["Python", "FastAPI", "PostgreSQL", "Redis", "AWS", "Docker", "LangChain"],
  },
  {
    id: 2,
    translations: {
      en: {
        location: "San Francisco, CA",
        description:
          "Developed and maintained backend systems for data processing pipelines. Specialized in building APIs and database optimization for high-throughput applications.",
        achievements: [
          "Built ETL pipelines processing 500GB+ daily data",
          "Implemented real-time analytics dashboard backend",
          "Optimized database queries improving performance by 60%",
          "Collaborated with data science team on ML model deployment",
        ],
      },
      pl: {
        location: "San Francisco, CA",
        description:
          "Rozwój i utrzymanie systemów backendowych dla potoków przetwarzania danych. Specjalizacja w budowaniu API i optymalizacji baz danych dla aplikacji o wysokiej przepustowości.",
        achievements: [
          "Budowa potoków ETL przetwarzających ponad 500GB danych dziennie",
          "Implementacja backendu dla dashboardu analityki w czasie rzeczywistym",
          "Optymalizacja zapytań do bazy danych poprawiająca wydajność o 60%",
          "Współpraca z zespołem data science przy wdrażaniu modeli ML",
        ],
      },
    },
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2022-01-01T00:00:00Z",
    position: "Backend Developer",
    start: "2020-01-01",
    end: "2022-01-01",
    company: "DataFlow Solutions",
    technologies: ["Python", "Django", "MongoDB", "Celery", "ElasticSearch", "Kubernetes"],
  },
  {
    id: 3,
    translations: {
      en: {
        location: "New York, NY",
        description:
          "Joined early-stage startup to build the initial product from ground up. Worked on both frontend and backend development while establishing development practices.",
        achievements: [
          "Built MVP from concept to deployment in 4 months",
          "Established CI/CD pipeline and development workflows",
          "Implemented user authentication and authorization system",
          "Mentored junior developers on best practices",
        ],
      },
      pl: {
        location: "New York, NY",
        description:
          "Dołączenie do wczesnego startupu w celu budowy początkowego produktu od podstaw. Praca nad rozwojem frontendu i backendu przy jednoczesnym ustanowieniu praktyk developmentu.",
        achievements: [
          "Budowa MVP od koncepcji do wdrożenia w 4 miesiące",
          "Ustanowienie pipeline CI/CD i workflow developmentu",
          "Implementacja systemu uwierzytelniania i autoryzacji użytkowników",
          "Mentoring junior developerów w zakresie najlepszych praktyk",
        ],
      },
    },
    created_at: "2019-01-01T00:00:00Z",
    updated_at: "2020-01-01T00:00:00Z",
    position: "Full Stack Developer",
    start: "2019-01-01",
    end: "2020-01-01",
    company: "StartupX",
    technologies: ["Python", "Flask", "React", "PostgreSQL", "Heroku", "GitHub Actions"],
  },
];

export async function fetchExperiences(language: string): Promise<UiExperience[]> {
  if (env.mock) {
    // Use mock data when VITE_MOCK=true
    return mockExperiences.map((e) => mapApiExperienceToUi(e, language));
  }

  const data = await apiFetch<ApiExperience[]>(endpoints.work.experiences.list, {
    method: "GET",
    headers: { "Accept-Language": language },
  });
  return data.map((e) => mapApiExperienceToUi(e, language));
}

export function useExperiences() {
  const { language } = useSettings();
  return { fetch: () => fetchExperiences(language) };
}
