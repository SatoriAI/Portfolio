import { parseArticle } from "./workshop";

/**
 * The site's addresses as a crawler and the static server see them, built
 * from the same sources the app routes on: the standalone pages and old
 * addresses in config/navigation.ts and the published workshop pieces in
 * src/content. The build (vite.config.ts) turns them into `/sitemap.xml` and
 * into the server's `serve.json`, so a known address is answered with the
 * app, an old one with a 301, and any other with a real 404.
 */
export const SITE_URL = "https://www.dawidhanrahan.com";

/**
 * A path in the one form the site links to: lower case, without a trailing
 * slash. The server and the router both match paths case-insensitively, so
 * `/Experience` opens the page; its canonical still names `/experience`.
 */
export const canonicalPath = (path: string) => path.toLowerCase().replace(/\/+$/, "") || "/";

export const absoluteUrl = (path: string) => `${SITE_URL}${canonicalPath(path)}`;

/**
 * The slugs of the published workshop pieces, from the content files keyed
 * by their path under src/content (see readVexContent), read by the parser
 * the site itself uses, drafts left out. Once per piece, sorted.
 */
export const publishedPieceSlugs = (files: Record<string, string>): string[] => {
  const slugs = Object.entries(files)
    .filter(([path]) => path.startsWith("workshop/"))
    .map(([path, raw]) => parseArticle(path, raw))
    .filter((piece) => !piece.draft)
    .map((piece) => piece.slug);
  return [...new Set(slugs)].sort();
};

/** Every page a reader can land on: home, the standalone pages, each piece. */
export const sitePaths = (pages: readonly string[], pieceSlugs: readonly string[]): string[] => [
  "/",
  ...pages,
  ...pieceSlugs.map((slug) => `/workshop/${slug}`),
];

export const sitemapXml = (paths: readonly string[]) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => `  <url><loc>${absoluteUrl(path)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");

type Route = { source: string; destination: string };
type ServeConfig = {
  rewrites?: Route[];
  redirects?: (Route & { type: number })[];
  [setting: string]: unknown;
};

/**
 * `serve.json` with the site's routes merged into `config`, the settings
 * another step may already have written. Each known path is answered with
 * the app (the server matches a source with its trailing slash removed, so
 * `/experience` covers `/experience/`; `/` is listed because with directory
 * listing off the server no longer answers it on its own), each old address
 * with a 301. A route already there for one of these sources is replaced,
 * so merging twice gives the same file.
 */
export const serveConfig = (
  config: ServeConfig,
  paths: readonly string[],
  redirects: readonly { from: string; to: string }[],
): ServeConfig => {
  const ours = new Set([...paths, ...redirects.map((redirect) => redirect.from)]);
  const theirs = <R extends Route>(routes: R[] = []) =>
    routes.filter((route) => !ours.has(route.source));
  return {
    ...config,
    // No `/404` or `/index` aliases, and no listing of a folder such as /fonts/.
    cleanUrls: false,
    directoryListing: false,
    redirects: [
      ...theirs(config.redirects),
      ...redirects.map(({ from, to }) => ({ source: from, destination: to, type: 301 })),
    ],
    rewrites: [
      ...theirs(config.rewrites),
      ...paths.map((source) => ({ source, destination: "/index.html" })),
    ],
  };
};

const ADDRESS_TAGS = /\n?[ \t]*<(?:link rel="canonical"|meta property="og:url")[^>]*>/g;

/**
 * index.html as the not-found page: the same app, without the tags that
 * would name the home page as the address of whatever was mistyped.
 */
export const notFoundHtml = (indexHtml: string) => {
  const found = indexHtml.match(ADDRESS_TAGS)?.length ?? 0;
  if (found !== 2)
    throw new Error(`Expected a canonical and an og:url in index.html, found ${found}`);
  return indexHtml.replace(ADDRESS_TAGS, "");
};
