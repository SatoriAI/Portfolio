import react from "@vitejs/plugin-react-swc";
import { readFile } from "fs/promises";
import path from "path";
import { defineConfig, type Plugin } from "vite";

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

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [markdownQueries(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
