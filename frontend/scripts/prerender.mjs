// Run after both builds (vite.config.ts): writes every page of the site into
// dist, each as its own HTML file carrying its language, title and head tags
// (src/lib/pageMeta.ts) and its content, rendered by the server build in
// dist-ssr (src/entry-server.tsx), so a reader or a crawler that runs no
// script reads the page it asked for. Also 404.html, the same app with an
// empty root, which shows its not-found page under a real 404 status; the
// sitemap; and serve.json's routes, which answer each address with its file
// and each old one with a 301, while every other address falls through to
// 404.html. The routes are merged into the serve.json the browser build
// wrote, so its other settings keep their own owner.
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

// React's production build, as the browser runs, unless asked otherwise.
process.env.NODE_ENV ??= "production";

const dist = "dist";
const ROOT = '<div id="root"></div>';

const { movedAddresses, notFoundHtml, pageHtml, render, serveConfig, sitemapXml, sitePages } =
  await import(pathToFileURL(path.resolve("dist-ssr/entry-server.js")).href);

// The template as the browser build wrote it, before home's page replaces it.
const template = await readFile(path.join(dist, "index.html"), "utf8");
if (!template.includes(ROOT)) throw new Error(`index.html lacks ${ROOT}`);
await writeFile(path.join(dist, "404.html"), notFoundHtml(template));

for (const { address, file, head } of sitePages) {
  const content = await render(address);
  const html = pageHtml(template, head).replace(ROOT, () => `<div id="root">${content}</div>`);
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

console.log(`prerender: ${sitePages.length} pages`);
