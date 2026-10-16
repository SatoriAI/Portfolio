import { Writable } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import { pages as navigationPages, redirects } from "@/config/navigation";
import { workshopArticles } from "@/content/workshop";
import { pageHtml } from "@/lib/headTags";
import { languageBasename, languageOf, stripLanguage } from "@/lib/locale";
import { pageMeta } from "@/lib/pageMeta";
import { createQueryClient } from "@/lib/queries";
import {
  localizedRedirects,
  notFoundHtml,
  pageAddresses,
  pageFile,
  publishedPieceSlugs,
  serveConfig,
  sitemapXml,
  sitePaths,
} from "@/lib/siteMap";
import { preparePage } from "@/pages/routes";

import App, { AppRoutes } from "./App";

/**
 * The app as the build renders it, page by page (scripts/prerender.mjs), so
 * each page's HTML carries its content for a reader or a crawler that runs
 * no script; main.tsx then hydrates it. Built by `vite build --ssr` into
 * dist-ssr, never shipped.
 */

/**
 * The markup of the page at `address` (`/pl/research`), once everything on
 * it has loaded, and the source modules it needs beyond the main chunk
 * (see preparePage). API-backed sections render as loading, as they do in
 * the browser before their data arrives. Any error fails the render, and
 * the build with it, rather than leaving a page for the browser to render.
 */
export const render = async (address: string) => {
  const language = languageOf(address);
  const queryClient = createQueryClient();
  const modules = await preparePage(stripLanguage(address), language, queryClient);
  const html = await new Promise<string>((resolve, reject) => {
    let html = "";
    const sink = new Writable({
      write(chunk, _encoding, done) {
        html += chunk;
        done();
      },
      final(done) {
        resolve(html);
        done();
      },
    });
    const { pipe } = renderToPipeableStream(
      <App language={language} queryClient={queryClient}>
        <StaticRouter basename={languageBasename(language)} location={address}>
          <AppRoutes />
        </StaticRouter>
      </App>,
      {
        onAllReady: () => pipe(sink),
        onShellError: reject,
        onError: reject,
      },
    );
  });
  return { html, modules };
};

/**
 * Every page in both languages, from the same sources the app routes on
 * (lib/siteMap.ts), each with its head (lib/pageMeta.ts).
 */
export const sitePages = pageAddresses(
  sitePaths(
    navigationPages.map((page) => page.to),
    publishedPieceSlugs(workshopArticles),
  ),
).map(({ language, path, address }) => ({
  address,
  file: pageFile(address),
  head: pageMeta(path, language, workshopArticles),
}));

export const movedAddresses = localizedRedirects(redirects);

export { notFoundHtml, pageHtml, serveConfig, sitemapXml };
