import react from "@vitejs/plugin-react-swc";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { defineConfig, type Plugin } from "vite";

import { pages, redirects } from "./src/config/navigation";
import {
  notFoundHtml,
  publishedPieceSlugs,
  serveConfig,
  sitemapXml,
  sitePaths,
} from "./src/lib/siteMap";
import { VEX_LANGUAGES, vexBundle } from "./src/lib/vexKnowledge";
import { readVexContent } from "./src/lib/vexKnowledgeFiles";
import { parseArticle, parseHeader } from "./src/lib/workshop";

/**
 * Answers two queries on the site's Markdown at build time, so the bundle
 * holds only what a page shows of a document, never its whole text:
 *
 * - `<project>.md?card`, what the home page shows of a project, its title,
 *   summary and stack (see src/content/projects/index.ts);
 * - `<piece>.md?header`, a workshop piece without its text, for the lists
 *   (see src/content/workshop/index.ts); the text loads with the piece's page.
 */
const markdownQueries = (): Plugin => ({
  name: "markdown-queries",
  enforce: "pre",
  async load(id) {
    const [file, query] = id.split("?");
    if (query === "header") {
      const { body: _body, ...header } = parseArticle(file, await readFile(file, "utf8"));
      return `export default ${JSON.stringify(header)};`;
    }
    if (query !== "card") return null;
    const { header } = parseHeader(await readFile(file, "utf8"));
    if (!header.title || !header.summary || !header.stack) {
      this.error(`Project document needs a title, a summary and a stack: ${file}`);
    }
    const stack = header.stack.split(",").map((name) => name.trim());
    return `export default ${JSON.stringify({ title: header.title, summary: header.summary, stack })};`;
  },
});

/**
 * Publishes the site's Markdown for Vex as `/vex-kb/<pl|en>.json` (see
 * src/lib/vexKnowledge.ts): emitted into the build, and answered by the dev
 * server from the files as they are. The backend fetches these; the site's
 * own pages never load them.
 */
const vexKnowledge = (): Plugin => ({
  name: "vex-knowledge",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const match = /^\/vex-kb\/(pl|en)\.json$/.exec(request.url ?? "");
      if (!match) return next();
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(vexBundle(await readVexContent(), match[1] as "pl" | "en")));
    });
  },
  async generateBundle() {
    const files = await readVexContent();
    for (const language of VEX_LANGUAGES) {
      this.emitFile({
        type: "asset",
        fileName: `vex-kb/${language}.json`,
        source: JSON.stringify(vexBundle(files, language)),
      });
    }
  },
});

/**
 * Tells crawlers and the static server which addresses exist (see
 * src/lib/siteMap.ts): `/sitemap.xml` lists the pages, and `serve.json`
 * answers each known one with the app, each old one with a 301, while every
 * other address falls through to `404.html`, the same app, which shows its
 * not-found page under a real 404 status. Merged into whatever serve.json the build has already
 * written, so other settings for the server keep their own owner.
 */
const siteMap = (): Plugin => {
  let paths: string[] = [];
  return {
    name: "site-map",
    apply: "build",
    async generateBundle() {
      paths = sitePaths(
        pages.map((page) => page.to),
        publishedPieceSlugs(await readVexContent()),
      );
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(paths) });
    },
    async writeBundle({ dir = "dist" }) {
      const configFile = path.join(dir, "serve.json");
      const config = await readFile(configFile, "utf8").then(JSON.parse, () => ({}));
      await writeFile(configFile, JSON.stringify(serveConfig(config, paths, redirects), null, 2));
      const index = await readFile(path.join(dir, "index.html"), "utf8");
      await writeFile(path.join(dir, "404.html"), notFoundHtml(index));
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [markdownQueries(), vexKnowledge(), siteMap(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
