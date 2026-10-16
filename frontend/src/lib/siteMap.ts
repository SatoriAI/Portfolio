import { LANGUAGES, localizedPath } from "./locale";
import type { PageHead } from "./pageMeta";
import type { ArticleHeader } from "./workshop";

/**
 * The site's addresses as a crawler and the static server see them, built
 * from the same sources the app routes on: the standalone pages and old
 * addresses in config/navigation.ts and the published workshop pieces in
 * src/content, each in both languages (lib/locale.ts). The build
 * (scripts/prerender.mjs) turns them into `/sitemap.xml`, into one HTML file
 * per address, and into the server's `serve.json`, so a known address is
 * answered with its own file, an old one with a 301, and any other with a
 * real 404.
 */
export const SITE_URL = "https://www.dawidhanrahan.com";

/**
 * A path in the one form the site links to: lower case, without a trailing
 * slash. The server and the router both match paths case-insensitively, so
 * `/Experience` opens the page; its canonical still names `/experience`.
 */
export const canonicalPath = (path: string) => path.toLowerCase().replace(/\/+$/, "") || "/";

export const absoluteUrl = (path: string) => `${SITE_URL}${canonicalPath(path)}`;

/** The slugs of the published pieces, once per piece whatever its languages, sorted; no drafts. */
export const publishedPieceSlugs = (pieces: readonly ArticleHeader[]): string[] =>
  [...new Set(pieces.filter((piece) => !piece.draft).map((piece) => piece.slug))].sort();

/** Every page a reader can land on: home, the standalone pages, each piece. */
export const sitePaths = (pages: readonly string[], pieceSlugs: readonly string[]): string[] => [
  "/",
  ...pages,
  ...pieceSlugs.map((slug) => `/workshop/${slug}`),
];

/** Every page in every language: the language, its path within it, and its address. */
export const pageAddresses = (paths: readonly string[]) =>
  LANGUAGES.flatMap((language) =>
    paths.map((path) => ({ language, path, address: localizedPath(language, path) })),
  );

/** The file the build writes for an address: `/pl/research` is `pl/research/index.html`. */
export const pageFile = (address: string) =>
  address === "/" ? "index.html" : `${address.slice(1)}/index.html`;

/**
 * One `<url>` per canonical address, with the page in each of its languages
 * and x-default. A piece's address in a language it was not written in names
 * the other as canonical, so only that one is listed.
 */
export const sitemapXml = (heads: readonly PageHead[]) => {
  const canonical = new Map<string, PageHead>();
  for (const head of heads) if (head.canonical) canonical.set(head.canonical, head);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...[...canonical].map(([loc, { alternates }]) =>
      [
        "  <url>",
        `    <loc>${loc}</loc>`,
        ...alternates.map(
          ({ hreflang, href }) =>
            `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`,
        ),
        "  </url>",
      ].join("\n"),
    ),
    "</urlset>",
    "",
  ].join("\n");
};

/** The old addresses in each language: `/pl/academic` opens `/pl/research`. */
export const localizedRedirects = (redirects: readonly { from: string; to: string }[]) =>
  LANGUAGES.flatMap((language) =>
    redirects.map(({ from, to }) => ({
      from: localizedPath(language, from),
      to: localizedPath(language, to),
    })),
  );

type Route = { source: string; destination: string };
type Headers = { source: string; headers: { key: string; value: string }[] };
type ServeConfig = {
  headers?: Headers[];
  rewrites?: Route[];
  redirects?: (Route & { type: number })[];
  [setting: string]: unknown;
};

/**
 * How long a browser keeps a file, matched on the file's path: a page is
 * asked about again on every visit, so a deploy shows at once, and so is
 * boot.js, which every page runs first; the bundle's
 * files carry a hash of their content in their names, so they never change.
 */
const CACHE_HEADERS: Headers[] = [
  { source: "**/*.html", headers: [{ key: "Cache-Control", value: "no-cache" }] },
  { source: "boot.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
  {
    source: "assets/**",
    headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
  },
];

/**
 * `serve.json` with the site's routes merged into `config`, the settings
 * another step may already have written. Each address is answered with its
 * own file (the server matches a source with its trailing slash removed and
 * in any case, so `/Experience/` is `/experience`; with directory listing
 * off, a folder the build wrote is answered only through these), each old
 * address with a 301. A route or header already there for one of these
 * sources is replaced, so merging twice gives the same file.
 */
export const serveConfig = (
  config: ServeConfig,
  addresses: readonly string[],
  redirects: readonly { from: string; to: string }[],
): ServeConfig => {
  const ours = new Set([
    ...addresses,
    ...redirects.map((redirect) => redirect.from),
    ...CACHE_HEADERS.map((entry) => entry.source),
  ]);
  const theirs = <R extends { source: string }>(routes: R[] = []) =>
    routes.filter((route) => !ours.has(route.source));
  return {
    ...config,
    // No `/404` or `/index` aliases, and no listing of a folder such as /fonts/.
    cleanUrls: false,
    directoryListing: false,
    headers: [...theirs(config.headers), ...CACHE_HEADERS],
    redirects: [
      ...theirs(config.redirects),
      ...redirects.map(({ from, to }) => ({ source: from, destination: to, type: 301 })),
    ],
    rewrites: [
      ...theirs(config.rewrites),
      ...addresses.map((source) => ({ source, destination: `/${pageFile(source)}` })),
    ],
  };
};

const ADDRESS_TAGS = /\n?[ \t]*<(?:link rel="canonical"|meta property="og:url")[^>]*>/g;

/**
 * index.html, as the template stands before any page is written over it, as
 * the not-found page: the same app, without the tags that would name the
 * home page as the address of whatever was mistyped. The app sets its
 * language from the address it was opened at.
 */
export const notFoundHtml = (indexHtml: string) => {
  const found = indexHtml.match(ADDRESS_TAGS)?.length ?? 0;
  if (found !== 2)
    throw new Error(`Expected a canonical and an og:url in index.html, found ${found}`);
  return indexHtml.replace(ADDRESS_TAGS, "");
};
