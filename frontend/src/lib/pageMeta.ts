import { translations } from "../utils/translations";

import { DEFAULT_LANGUAGE, type Language, LANGUAGES, localizedPath } from "./locale";
import { findThread, threadCopy } from "./researchThreads";
import { absoluteUrl, canonicalPath } from "./siteMap";
import { type ArticleHeader, articlesFor } from "./workshop";

/** The head of one page in one language: what the app sets, and what the build writes. */
export type PageHead = {
  language: Language;
  title: string;
  description: string;
  /** Absolute; null for a page with no address of its own, such as not-found. */
  canonical: string | null;
  /** The page in every language it exists in, then x-default; empty for a page in one only. */
  alternates: { hreflang: Language | "x-default"; href: string }[];
};

type MetaKey = keyof (typeof translations)["en"]["meta"];

/** The standalone pages' own titles and descriptions, by path. */
const PAGE_META: Record<string, MetaKey> = {
  "/": "home",
  "/experience": "experience",
  "/research": "research",
  "/education": "education",
  "/workshop": "workshop",
};

export const pageMetaPaths = Object.keys(PAGE_META);

const urlIn = (language: Language, path: string) => absoluteUrl(localizedPath(language, path));

const everyLanguage = (path: string): PageHead["alternates"] => [
  ...LANGUAGES.map((hreflang) => ({ hreflang, href: urlIn(hreflang, path) })),
  { hreflang: "x-default", href: urlIn(DEFAULT_LANGUAGE, path) },
];

/**
 * The head of the page at `path` (the router's path, without the language
 * prefix, in any case) in `language`. A workshop piece takes its title and
 * summary from `pieces`, as the page shows it; a piece written in one
 * language only names that language's address as canonical and has no
 * alternates. Any other path is not-found, without an address. Drafts count
 * only when asked for, as the workshop's pages show them (showDrafts).
 */
export const pageMeta = (
  path: string,
  language: Language,
  all: readonly ArticleHeader[],
  { drafts = false } = {},
): PageHead => {
  const pieces = drafts ? all : all.filter((piece) => !piece.draft);
  const meta = translations[language].meta;
  const page = canonicalPath(path);

  const key = PAGE_META[page];
  if (key) {
    return {
      language,
      ...meta[key],
      canonical: urlIn(language, page),
      alternates: everyLanguage(page),
    };
  }

  // A research thread's page, titled by the thread, its question for the description.
  const thread = findThread(/^\/research\/([^/]+)$/.exec(page)?.[1]);
  if (thread) {
    const { title, lead } = threadCopy(translations[language], thread.slug);
    return {
      language,
      title: `${title} · Dawid Hanrahan`,
      description: lead,
      canonical: urlIn(language, page),
      alternates: everyLanguage(page),
    };
  }

  const slug = /^\/workshop\/([^/]+)$/.exec(page)?.[1];
  const shown = slug && articlesFor(pieces, language, { drafts }).find((p) => p.slug === slug);
  if (shown) {
    const inBoth = LANGUAGES.every((other) =>
      pieces.some((piece) => piece.slug === slug && piece.language === other),
    );
    return {
      language,
      title: `${shown.title} · Dawid Hanrahan`,
      description: shown.summary,
      canonical: urlIn(shown.language, page),
      alternates: inBoth ? everyLanguage(page) : [],
    };
  }

  return { language, ...meta.notFound, canonical: null, alternates: [] };
};
