import react from "@vitejs/plugin-react-swc";
import { readFile } from "fs/promises";
import path from "path";
import { defineConfig, type Plugin } from "vite";

import { parseHeader } from "./src/lib/workshop";

/**
 * Answers `<document>.md?card` with what the home page shows of a project, its
 * title, summary and stack, so the whole document is never bundled. See
 * src/content/projects/index.ts.
 */
const projectCards = (): Plugin => ({
  name: "project-cards",
  enforce: "pre",
  async load(id) {
    const [file, query] = id.split("?");
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
  plugins: [projectCards(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
