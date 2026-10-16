import { type ComponentType, createElement, lazy } from "react";
import { matchPath } from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";

import { articleModule, showDrafts, workshopArticles } from "@/content/workshop";
import type { Language } from "@/lib/locale";
import { prefetchArticleText } from "@/lib/queries";
import { articlesFor } from "@/lib/workshop";

import Index from "./Index";

// The pages that load when navigated to, each its own chunk. Through a glob
// rather than import() calls, so a page's source file, which names its chunk
// in the build's manifest (see scripts/prerender.mjs), and its loader are one
// key. Vite reads this call at build time, so its options must be literals.
const LOADERS = import.meta.glob<{ default: ComponentType }>([
  "./Experience.tsx",
  "./Academic.tsx",
  "./Education.tsx",
  "./Workshop.tsx",
  "./WorkshopArticle.tsx",
  "./NotFound.tsx",
]);

/**
 * A route's page in a chunk of its own, which `preload` fetches ahead of
 * rendering. Once fetched the page renders directly rather than through
 * React.lazy, which suspends at least once even for a chunk already loaded:
 * the browser hydrates the page the build rendered in one pass, and the
 * build's render needs no Suspense to resolve. `module` is its source file,
 * as the build's manifest names it.
 */
const chunk = (file: keyof typeof LOADERS & string) => {
  const load = LOADERS[file];
  let Loaded: ComponentType | undefined;
  const Lazy = lazy(load);
  const preload = async () => {
    Loaded ??= (await load()).default;
  };
  const Page = () => createElement(Loaded ?? Lazy);
  return Object.assign(Page, { preload, module: `src/pages/${file.slice(2)}` });
};

export const NotFound = chunk("./NotFound.tsx");

/**
 * The pages by path, written once, without a language: the router's
 * basename carries `/pl`. The landing page ships in the main chunk so first
 * paint never waits on a second request; the others load when navigated to.
 */
export const PAGES: readonly {
  path: string;
  Page: ComponentType & { preload?: () => Promise<void>; module?: string };
}[] = [
  { path: "/", Page: Index },
  { path: "/experience", Page: chunk("./Experience.tsx") },
  { path: "/research", Page: chunk("./Academic.tsx") },
  { path: "/education", Page: chunk("./Education.tsx") },
  { path: "/workshop", Page: chunk("./Workshop.tsx") },
  { path: "/workshop/:slug", Page: chunk("./WorkshopArticle.tsx") },
];

/**
 * What the page at `path` (the router's, without the language prefix)
 * needs before it can render in full, fetched into `queryClient`: its chunk,
 * and a workshop piece's text. Both entries await it, so the build writes
 * the whole page and the browser takes over the same page at once. Answers
 * the source modules it loaded beyond the main chunk, for the build to link
 * from the page's HTML.
 */
export const preparePage = async (
  path: string,
  language: Language,
  queryClient: QueryClient,
): Promise<string[]> => {
  const match = PAGES.map(({ path: pattern, Page }) => ({
    Page,
    params: matchPath(pattern, path)?.params,
  })).find(({ params }) => params);
  const Page = match?.Page ?? NotFound;
  const slug = match?.params?.slug?.toLowerCase();
  const piece = slug
    ? articlesFor(workshopArticles, language, { drafts: showDrafts }).find((p) => p.slug === slug)
    : undefined;
  await Promise.all([Page.preload?.(), piece && prefetchArticleText(queryClient, piece)]);
  return [Page.module, piece && articleModule(piece)].filter((module) => module !== undefined);
};
