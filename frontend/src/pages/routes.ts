import { type ComponentType, createElement, lazy } from "react";
import { matchPath } from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";

import { showDrafts, workshopArticles } from "@/content/workshop";
import type { Language } from "@/lib/locale";
import { prefetchArticleText } from "@/lib/queries";
import { articlesFor } from "@/lib/workshop";

import Index from "./Index";

/**
 * A route's page in a chunk of its own, which `preload` fetches ahead of
 * rendering. Once fetched the page renders directly rather than through
 * React.lazy, which suspends at least once even for a chunk already loaded:
 * the browser hydrates the page the build rendered in one pass, and the
 * build's render needs no Suspense to resolve.
 */
const chunk = (load: () => Promise<{ default: ComponentType }>) => {
  let Loaded: ComponentType | undefined;
  const Lazy = lazy(load);
  const preload = async () => {
    Loaded ??= (await load()).default;
  };
  const Page = () => createElement(Loaded ?? Lazy);
  return Object.assign(Page, { preload });
};

export const NotFound = chunk(() => import("./NotFound"));

/**
 * The pages by path, written once, without a language: the router's
 * basename carries `/pl`. The landing page ships in the main chunk so first
 * paint never waits on a second request; the others load when navigated to.
 */
export const PAGES: readonly {
  path: string;
  Page: ComponentType & { preload?: () => Promise<void> };
}[] = [
  { path: "/", Page: Index },
  { path: "/experience", Page: chunk(() => import("./Experience")) },
  { path: "/research", Page: chunk(() => import("./Academic")) },
  { path: "/education", Page: chunk(() => import("./Education")) },
  { path: "/workshop", Page: chunk(() => import("./Workshop")) },
  { path: "/workshop/:slug", Page: chunk(() => import("./WorkshopArticle")) },
];

/**
 * What the page at `path` (the router's, without the language prefix)
 * needs before it can render in full, fetched into `queryClient`: its chunk,
 * and a workshop piece's text. Both entries await it, so the build writes
 * the whole page and the browser takes over the same page at once.
 */
export const preparePage = async (path: string, language: Language, queryClient: QueryClient) => {
  const match = PAGES.map(({ path: pattern, Page }) => ({
    Page,
    params: matchPath(pattern, path)?.params,
  })).find(({ params }) => params);
  if (!match) return NotFound.preload();
  const slug = match.params?.slug?.toLowerCase();
  const piece = slug
    ? articlesFor(workshopArticles, language, { drafts: showDrafts }).find((p) => p.slug === slug)
    : undefined;
  await Promise.all([match.Page.preload?.(), piece && prefetchArticleText(queryClient, piece)]);
};
