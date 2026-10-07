/**
 * What each technology does in a project, so a project's stack reads as how
 * it is built rather than as a flat list: its backend, its data, its
 * frontend, its AI, the services it calls, where it runs. Keyed by the name
 * as the project documents spell it (src/content/projects). A name not listed
 * here falls into "other" rather than being guessed at.
 */

export type TechGroup = "backend" | "data" | "frontend" | "ai" | "services" | "cloud" | "other";

/** The order the groups are read in, from what the project is to where it runs. */
export const TECH_GROUP_ORDER: readonly TechGroup[] = [
  "backend",
  "data",
  "frontend",
  "ai",
  "services",
  "cloud",
  "other",
];

const GROUP_OF: Readonly<Record<string, TechGroup>> = {
  Python: "backend",
  Django: "backend",
  FastAPI: "backend",
  SQLAlchemy: "backend",
  Celery: "backend",
  PostgreSQL: "data",
  Alembic: "data",
  pgvector: "data",
  Redis: "data",
  Tigris: "data",
  "Google Cloud Storage": "data",
  React: "frontend",
  "Vue.js": "frontend",
  Vue: "frontend",
  SvelteKit: "frontend",
  Svelte: "frontend",
  TypeScript: "frontend",
  Vite: "frontend",
  "Tailwind CSS": "frontend",
  "shadcn/ui": "frontend",
  OpenAI: "ai",
  "Google Gemini": "ai",
  LangChain: "ai",
  LangGraph: "ai",
  GenAI: "ai",
  Resend: "services",
  "Google Maps Platform": "services",
  Pipedream: "services",
  Docker: "cloud",
  Railway: "cloud",
  "Google Cloud": "cloud",
  Vercel: "cloud",
  Caddy: "cloud",
  Cloudflare: "cloud",
};

/** What the technology does, or "other" when it is not listed. */
export const techGroupOf = (tag: string): TechGroup => GROUP_OF[tag] ?? "other";

/** A project's tags grouped and in reading order, each group keeping the tags' own order. */
export const groupTechnologies = (tags: readonly string[]) => {
  const groups = new Map<TechGroup, string[]>();
  for (const tag of tags) {
    const group = techGroupOf(tag);
    groups.set(group, [...(groups.get(group) ?? []), tag]);
  }
  return TECH_GROUP_ORDER.filter((group) => groups.has(group)).map((group) => ({
    group,
    tags: groups.get(group)!,
  }));
};
