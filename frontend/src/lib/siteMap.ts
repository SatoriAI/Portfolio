/**
 * The site's addresses as a crawler and the static server see them, built
 * from the same sources the app routes on: the standalone pages in
 * config/navigation.ts and the published workshop pieces in src/content.
 * The build (vite.config.ts) turns them into `/sitemap.xml` and into the
 * server's rewrites, so a known address is answered with the app and any
 * other with a real 404.
 */
export const SITE_URL = "https://www.dawidhanrahan.com";

/** A path without its trailing slash, the one form the site links to. */
export const canonicalPath = (path: string) => path.replace(/\/+$/, "") || "/";

export const absoluteUrl = (path: string) => `${SITE_URL}${canonicalPath(path)}`;

// Drafts (`<slug>.<lang>.draft.md`) do not match: they are never published.
const PUBLISHED_PIECE = /^workshop\/([a-z0-9-]+)\.(pl|en)\.md$/;

/**
 * The slugs of the published workshop pieces, from the content files keyed
 * by their path under src/content (see readVexContent), once per piece
 * whatever its languages, sorted.
 */
export const publishedPieceSlugs = (files: Record<string, string>): string[] =>
  [...new Set(Object.keys(files).flatMap((path) => PUBLISHED_PIECE.exec(path)?.[1] ?? []))].sort();

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

/**
 * `serve` rewrites that answer each known path with the app. The server
 * matches a source with its trailing slash removed, so `/experience/` is
 * covered by `/experience`. `/` is listed too: with directory listing off,
 * the server no longer answers it with index.html on its own.
 */
export const appRewrites = (paths: readonly string[]) =>
  paths.map((source) => ({ source, destination: "/index.html" }));
