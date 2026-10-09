import { endpoints } from "../config/endpoints";
import { env } from "../config/env";

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

/** Every translation at once: the page picks its language (see lib/queries.ts). */
export const fetchExperiences = (): Promise<ApiExperience[]> =>
  env.mock
    ? Promise.resolve(mockExperiences)
    : apiClient.getList<ApiExperience[]>(endpoints.work.experiences.list);
