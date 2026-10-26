import { type ComponentType, createElement, lazy } from "react";
import { matchPath } from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";

import { articleModule, showDrafts, workshopArticles } from "@/content/workshop";
import type { Language } from "@/lib/locale";
import { prefetchArticleText, seedLists } from "@/lib/queries";
import { type ListName, pickLists, type Snapshot } from "@/lib/snapshot";
import { articlesFor } from "@/lib/workshop";

import Index from "./Index";

// The pages that load when navigated to, each its own chunk. Through a glob
// rather than import() calls, so a page's source file, which names its chunk
// in the build's manifest (see scripts/prerender.mjs), and its loader are one
// key. Vite reads this call at build time, so its options must be literals.
const LOADERS = import.meta.glob<{ default: ComponentType }>([
  "./Experience.tsx",
  "./Academic.tsx",
  "./ResearchThread.tsx",
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
 * `lists` are the backend's lists the page reads (lib/queries.ts), which its
 * HTML is rendered with and carries; a list left out would only be fetched
 * in the browser, and the page would show it loading on both sides.
 */
export const PAGES: readonly {
  path: string;
  Page: ComponentType & { preload?: () => Promise<void>; module?: string };
  lists?: readonly ListName[];
}[] = [
  { path: "/", Page: Index, lists: ["projects"] },
  {
    path: "/experience",
    Page: chunk("./Experience.tsx"),
    lists: ["experiences", "skills", "projects"],
  },
  { path: "/research", Page: chunk("./Academic.tsx"), lists: ["publications"] },
  { path: "/research/:thread", Page: chunk("./ResearchThread.tsx") },
  { path: "/education", Page: chunk("./Education.tsx"), lists: ["schools", "testimonials"] },
  { path: "/workshop", Page: chunk("./Workshop.tsx") },
  { path: "/workshop/:slug", Page: chunk("./WorkshopArticle.tsx") },
];

/**
 * What the page at `path` (the router's, without the language prefix)
 * needs before it can render in full, put into `queryClient`: its chunk, a
 * workshop piece's text, and its lists from `snapshot` (the build's whole
 * one, or the part of it the page's HTML carries). Both entries await it,
 * so the build writes the whole page and the browser takes over the same
 * page at once. Answers the source modules it loaded beyond the main chunk,
 * for the build to link from the page's HTML, and the lists it seeded, for
 * the build to write into it.
 */
export const preparePage = async (
  path: string,
  language: Language,
  queryClient: QueryClient,
  snapshot?: Snapshot,
): Promise<{ modules: string[]; lists?: Snapshot }> => {
  const match = PAGES.map(({ path: pattern, Page, lists }) => ({
    Page,
    lists,
    params: matchPath(pattern, path)?.params,
  })).find(({ params }) => params);
  const lists = pickLists(snapshot, match?.lists ?? []);
  if (lists) seedLists(queryClient, lists);
  const Page = match?.Page ?? NotFound;
  const slug = match?.params?.slug?.toLowerCase();
  const piece = slug
    ? articlesFor(workshopArticles, language, { drafts: showDrafts }).find((p) => p.slug === slug)
    : undefined;
  await Promise.all([Page.preload?.(), piece && prefetchArticleText(queryClient, piece)]);
  const modules = [Page.module, piece && articleModule(piece)].filter(
    (module) => module !== undefined,
  );
  return { modules, lists };
};
