import { typeset } from "./typography";

/**
 * "Z warsztatu": short pieces written as Markdown files in the repo, one file
 * per piece per language, `src/content/workshop/<slug>.<lang>.md`. A draft is
 * named `<slug>.<lang>.draft.md`: it shows on the local dev server only and is
 * never read into a build, so an unpublished piece cannot leak through the
 * site's code; publishing is renaming it. Each file opens with a small header
 * of `key: value` lines between `---` fences:
 *
 *   title    the piece's title
 *   date     YYYY-MM-DD, when it was published
 *   format   figure | production | proof — what kind of piece it is
 *   summary  one sentence, shown in the lists
 *   related  a page it belongs with, e.g. /research (optional)
 *   figure   the piece's evidence in small, by name, e.g. grokking: shown
 *            on the home page and the index (optional). In the piece's own
 *            text it is placed where it belongs, as an image line:
 *            `![what it shows](/figure/grokking "Caption")`
 *   showcase yes: also set the figure under the summary, before the text,
 *            for a piece whose result is the point of it (optional)
 *   caption  one sentence beside that showcased figure (optional)
 *   stamp    the word over each section's number in the margin, e.g.
 *            Próba / Trial; plain numbers without it (optional)
 *   tags     a few topics, separated by commas (optional)
 *
 * A piece that exists in one language only is shown in the other with a note
 * saying so, rather than machine-translated. This module holds the parsing
 * and the choosing, so both can be tested without a browser.
 */

export type WorkshopFormat = "figure" | "production" | "proof";
export type WorkshopLanguage = "pl" | "en";

export type WorkshopArticle = {
  slug: string;
  language: WorkshopLanguage;
  title: string;
  date: string;
  format: WorkshopFormat;
  summary: string;
  related?: string;
  /** The name of the piece's small figure, if it has one. */
  figure?: string;
  /** Whether the figure is also set under the summary, before the text. */
  showcase: boolean;
  /** One sentence beside the showcased figure. */
  caption?: string;
  /** The word over each section's number in the margin. */
  stamp?: string;
  /** A few topics, shown beside the piece. */
  tags: string[];
  draft: boolean;
  body: string;
  /** Rounded up, at the reading pace below. */
  minutes: number;
};

/** A reading pace for technical prose, in words a minute. */
const WORDS_PER_MINUTE = 200;
const FORMATS: readonly WorkshopFormat[] = ["figure", "production", "proof"];

/** The header between the opening `---` lines, and the Markdown after it. */
export const parseHeader = (raw: string): { header: Record<string, string>; body: string } => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { header: {}, body: raw };
  const header: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at <= 0) continue;
    header[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
  }
  return { header, body: raw.slice(match[0].length) };
};

export const readingMinutes = (body: string) =>
  Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE));

/**
 * One file into a piece: its slug and language from the file name, the rest
 * from its header. A file whose name or header is incomplete is an error, so
 * a mistake shows while writing rather than as a quietly missing piece.
 */
export const parseArticle = (path: string, raw: string): WorkshopArticle => {
  const name = /([^/]+)\.(pl|en)(\.draft)?\.md$/.exec(path);
  if (!name) throw new Error(`Workshop file name must be <slug>.<pl|en>[.draft].md: ${path}`);
  const { header, body } = parseHeader(raw);
  const format = header.format as WorkshopFormat;
  if (
    !header.title ||
    !/^\d{4}-\d{2}-\d{2}$/.test(header.date ?? "") ||
    !FORMATS.includes(format)
  ) {
    throw new Error(`Workshop file needs a title, a YYYY-MM-DD date and a format: ${path}`);
  }
  return {
    slug: name[1],
    language: name[2] as WorkshopLanguage,
    title: typeset(header.title, name[2]),
    date: header.date,
    format,
    summary: typeset(header.summary ?? "", name[2]),
    related: header.related || undefined,
    figure: header.figure || undefined,
    showcase: header.showcase === "yes",
    caption: header.caption || undefined,
    stamp: header.stamp || undefined,
    tags: (header.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    draft: Boolean(name[3]),
    body,
    minutes: readingMinutes(body),
  };
};

/** A piece as a reader in `language` sees it, and whether it is in theirs. */
export type ShownArticle = WorkshopArticle & { inOtherLanguage: boolean };

/**
 * The pieces a reader sees, newest first: each in their language where it
 * exists, otherwise in the one it was written in. Drafts only when asked for.
 */
export const articlesFor = (
  all: readonly WorkshopArticle[],
  language: WorkshopLanguage,
  { drafts = false } = {},
): ShownArticle[] => {
  const bySlug = new Map<string, WorkshopArticle[]>();
  for (const article of all) {
    if (article.draft && !drafts) continue;
    bySlug.set(article.slug, [...(bySlug.get(article.slug) ?? []), article]);
  }
  return [...bySlug.values()]
    .map((versions) => {
      const own = versions.find((version) => version.language === language);
      return own ? { ...own, inOtherLanguage: false } : { ...versions[0], inOtherLanguage: true };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
};

/** A piece's date as the reader's language writes it: "1 października 2026". */
/** English dates are set British-style ("1 October 2026"), as the site spells British. */
export const formatDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

/** A piece's text cut at its `##` headings: the part before the first, then one per heading. */
export type ArticleSection = { heading?: string; body: string };

const FENCE = /^(```|~~~)/;
const FOOTNOTE_DEFINITION = /^\[\^[^\]]+\]:/;

/**
 * The piece's body as sections, so each heading can stand in the margin
 * beside its own text. A `##` inside a code block is code, not a heading.
 * Footnote definitions, wherever they were written, go with every section
 * that cites them, so each section's notes render under it.
 */
export const splitSections = (markdown: string): ArticleSection[] => {
  const lines = markdown.split(/\r?\n/);
  const definitions: string[][] = [];
  const sections: { heading?: string; lines: string[] }[] = [{ lines: [] }];
  let fenced = false;
  let inDefinition = false;
  for (const line of lines) {
    if (FENCE.test(line.trim())) fenced = !fenced;
    if (!fenced && FOOTNOTE_DEFINITION.test(line)) {
      definitions.push([line]);
      inDefinition = true;
      continue;
    }
    // A definition's continuation lines are indented; a blank line or an
    // unindented one ends it.
    if (inDefinition && /^( {2,}|\t)\S/.test(line)) {
      definitions[definitions.length - 1].push(line);
      continue;
    }
    inDefinition = false;
    const heading = !fenced && /^## (.+)$/.exec(line);
    if (heading) sections.push({ heading: heading[1].trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }
  return sections
    .map(({ heading, lines: own }) => {
      let body = own.join("\n").trim();
      const cited = definitions.filter((definition) => {
        const label = /^\[\^([^\]]+)\]:/.exec(definition[0])![1];
        return body.includes(`[^${label}]`);
      });
      if (cited.length)
        body += "\n\n" + cited.map((definition) => definition.join("\n")).join("\n");
      return { heading, body };
    })
    .filter((section) => section.heading || section.body);
};
