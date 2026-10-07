import type { Language } from "@/utils/translations";

/**
 * What the home page shows of each project that has a document here (see
 * README.md): its summary, from the `summary` line, and its stack, from the
 * `stack` line, keyed by language and then by the project's title as the
 * backend gives it. The `?card` query is answered at build time by the plugin
 * in vite.config.ts with those lines only, so the documents' full text never
 * reaches the site's code.
 */
export type ProjectCard = { summary: string; stack: readonly string[] };

// Vite reads this call at build time, so its options must be literals.
const files = import.meta.glob<ProjectCard & { title: string }>("./*.{pl,en}.md", {
  query: "?card",
  import: "default",
  eager: true,
});

const cards: Record<string, Record<string, ProjectCard>> = {};
for (const [path, { title, summary, stack }] of Object.entries(files)) {
  const language = /\.(pl|en)\.md$/.exec(path)![1];
  (cards[language] ??= {})[title] = { summary, stack };
}

/** The card of the project with this title, if it has a document. */
export const projectCard = (title: string, language: Language): ProjectCard | undefined =>
  cards[language]?.[title];
