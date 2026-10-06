import { parseArticle, type WorkshopArticle } from "@/lib/workshop";

/**
 * Every piece in this folder, read at build time. Add a piece by adding a
 * `<slug>.<pl|en>.md` file here; see lib/workshop.ts for its header. Drafts,
 * `<slug>.<pl|en>.draft.md`, are read only by the local dev server: a build
 * never imports them, so their text is not in the site's code.
 */
// Vite reads these calls at build time, so their options must be literals.
const published = import.meta.glob<string>(["./*.md", "!./*.draft.md"], {
  query: "?raw",
  import: "default",
  eager: true,
});
const drafts = import.meta.env.DEV
  ? import.meta.glob<string>("./*.draft.md", { query: "?raw", import: "default", eager: true })
  : {};

export const workshopArticles: readonly WorkshopArticle[] = Object.entries({
  ...published,
  ...drafts,
}).map(([path, text]) => parseArticle(path, text));

/** Drafts show while writing, on the local dev server, and never in a build. */
export const showDrafts = import.meta.env.DEV;
