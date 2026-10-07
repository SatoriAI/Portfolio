import { type ArticleHeader, parseHeader } from "@/lib/workshop";

/**
 * Every piece in this folder. Add a piece by adding a `<slug>.<pl|en>.md` file
 * here; see lib/workshop.ts for its header. The lists need only the headers,
 * which the `?header` query (vite.config.ts) reads at build time; a piece's
 * text is its own chunk, loaded when its page opens. Drafts,
 * `<slug>.<pl|en>.draft.md`, are read only by the local dev server: a build
 * never imports them, so their text is not in the site's code.
 */
// Vite reads these calls at build time, so their options must be literals.
const headers = {
  ...import.meta.glob<ArticleHeader>(["./*.md", "!./*.draft.md"], {
    query: "?header",
    import: "default",
    eager: true,
  }),
  ...(import.meta.env.DEV
    ? import.meta.glob<ArticleHeader>("./*.draft.md", {
        query: "?header",
        import: "default",
        eager: true,
      })
    : {}),
};
const texts = {
  ...import.meta.glob<string>(["./*.md", "!./*.draft.md"], { query: "?raw", import: "default" }),
  ...(import.meta.env.DEV
    ? import.meta.glob<string>("./*.draft.md", { query: "?raw", import: "default" })
    : {}),
};

export const workshopArticles: readonly ArticleHeader[] = Object.values(headers);

/** A piece's Markdown text, without its header. */
export const loadArticleBody = async ({ slug, language, draft }: ArticleHeader) => {
  const raw = await texts[`./${slug}.${language}${draft ? ".draft" : ""}.md`]();
  return parseHeader(raw).body;
};

/** Drafts show while writing, on the local dev server, and never in a build. */
export const showDrafts = import.meta.env.DEV;
