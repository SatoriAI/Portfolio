import react from "@vitejs/plugin-react-swc";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { defineConfig, type Plugin } from "vite";

import { VEX_LANGUAGES, vexBundle } from "./src/lib/vexKnowledge";
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
const vexKnowledge = (): Plugin => {
  const content = path.resolve(__dirname, "./src/content");
  const read = async () => {
    const files: Record<string, string> = {};
    for (const folder of ["projects", "workshop"]) {
      for (const name of await readdir(path.join(content, folder))) {
        if (name.endsWith(".md")) {
          files[`${folder}/${name}`] = await readFile(path.join(content, folder, name), "utf8");
        }
      }
    }
    return files;
  };
  return {
    name: "vex-knowledge",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const match = /^\/vex-kb\/(pl|en)\.json$/.exec(request.url ?? "");
        if (!match) return next();
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(vexBundle(await read(), match[1] as "pl" | "en")));
      });
    },
    async generateBundle() {
      const files = await read();
      for (const language of VEX_LANGUAGES) {
        this.emitFile({
          type: "asset",
          fileName: `vex-kb/${language}.json`,
          source: JSON.stringify(vexBundle(files, language)),
        });
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [markdownQueries(), vexKnowledge(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
