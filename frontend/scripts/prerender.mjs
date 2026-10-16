// Run after both builds (vite.config.ts): writes every page of the site into
// dist, each as its own HTML file carrying its language, title and head tags
// (src/lib/pageMeta.ts) and its content, rendered by the server build in
// dist-ssr (src/entry-server.tsx), so a reader or a crawler that runs no
// script reads the page it asked for. Also 404.html, the same app with an
// empty root, which shows its not-found page under a real 404 status; the
// sitemap; and serve.json's routes, which answer each address with its file
// and each old one with a 301, while every other address falls through to
// 404.html. The routes are merged into the serve.json the browser build
// wrote, so its other settings keep their own owner. Each page also links the
// chunks the browser takes it over with (its route's, a piece's text), from
// the browser build's manifest, so they load alongside the main chunk rather
// than after it; the manifest itself is not shipped. The API's lists come
// from one snapshot (src/lib/snapshot.ts): each page is rendered with the
// lists it reads and carries them for the browser, and the whole snapshot is
// published for the next build to fall back on. A build the API does not
// answer still deploys, with the previous deploy's lists or with none.
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

// React's production build, as the browser runs, unless asked otherwise.
process.env.NODE_ENV ??= "production";

const dist = "dist";
const ROOT = '<div id="root"></div>';

const {
  buildSnapshot,
  movedAddresses,
  notFoundHtml,
  pageHtml,
  render,
  serveConfig,
  SNAPSHOT_FILE,
  snapshotElement,
  sitemapXml,
  sitePages,
} = await import(pathToFileURL(path.resolve("dist-ssr/entry-server.js")).href);

const manifestFile = path.join(dist, ".vite", "manifest.json");
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
// The main chunk and what it imports, which index.html already loads.
const loaded = new Set(["index.html", ...(manifest["index.html"].imports ?? [])]);

/** The tags that fetch these source modules' chunks, their imports and their styles. */
const chunkLinks = (modules) => {
  const scripts = new Set();
  const styles = new Set();
  const visit = (key) => {
    if (loaded.has(key) || scripts.has(manifest[key].file)) return;
    scripts.add(manifest[key].file);
    for (const style of manifest[key].css ?? []) styles.add(style);
    for (const imported of manifest[key].imports ?? []) visit(imported);
  };
  for (const module of modules) {
    // A query the module is imported with (`?raw`) is part of its key.
    const key = Object.keys(manifest).find((k) => k === module || k.startsWith(`${module}?`));
    if (!key) throw new Error(`No chunk in the build's manifest for ${module}`);
    visit(key);
  }
  return [
    ...[...scripts].map((file) => `    <link rel="modulepreload" crossorigin href="/${file}">\n`),
    ...[...styles].map((file) => `    <link rel="stylesheet" crossorigin href="/${file}">\n`),
  ].join("");
};

// The template as the browser build wrote it, before home's page replaces it.
const template = await readFile(path.join(dist, "index.html"), "utf8");
if (!template.includes(ROOT)) throw new Error(`index.html lacks ${ROOT}`);
await writeFile(path.join(dist, "404.html"), notFoundHtml(template));

// The site the previous deploy is at, for its snapshot: the live one unless set.
const snapshot = await buildSnapshot(process.env.PREVIOUS_SITE_URL || undefined);
if (snapshot) await writeFile(path.join(dist, SNAPSHOT_FILE), JSON.stringify(snapshot));

for (const { address, file, head } of sitePages) {
  const { html: content, modules, lists } = await render(address, snapshot);
  const html = pageHtml(template, head)
    .replace("  </head>", () => `${chunkLinks(modules)}  </head>`)
    .replace(
      ROOT,
      () => `<div id="root">${content}</div>${lists ? `\n    ${snapshotElement(lists)}` : ""}`,
    );
  await mkdir(path.dirname(path.join(dist, file)), { recursive: true });
  await writeFile(path.join(dist, file), html);
}

await writeFile(path.join(dist, "sitemap.xml"), sitemapXml(sitePages.map((page) => page.head)));

const configFile = path.join(dist, "serve.json");
const config = await readFile(configFile, "utf8").then(JSON.parse, () => ({}));
const addresses = sitePages.map((page) => page.address);
await writeFile(
  configFile,
  JSON.stringify(serveConfig(config, addresses, movedAddresses), null, 2),
);

await rm(path.dirname(manifestFile), { recursive: true });

console.log(`prerender: ${sitePages.length} pages`);
