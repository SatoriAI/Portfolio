import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";

import { markdownQueries } from "./markdownQueries";
import { serveConfig as securityServeConfig } from "./src/lib/securityHeaders";
import { VEX_LANGUAGES, vexBundle } from "./src/lib/vexKnowledge";
import { readVexContent } from "./src/lib/vexKnowledgeFiles";

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
 * Emits `serve.json`, which `serve` reads from the directory it serves, so
 * production sends the site's security headers (see src/lib/securityHeaders.ts).
 * Built from the same VITE_API_BASE_URL as the bundle, so the policy always
 * names the API the build calls.
 */
const securityHeaders = (apiBaseUrl: string | undefined): Plugin => ({
  name: "security-headers",
  apply: "build",
  generateBundle() {
    if (!apiBaseUrl)
      this.error("VITE_API_BASE_URL is not set: the security headers name the API it points at.");
    this.emitFile({
      type: "asset",
      fileName: "serve.json",
      source: JSON.stringify(securityServeConfig(apiBaseUrl), null, 2),
    });
  },
});

// https://vitejs.dev/config/
//
// `npm run build` builds the site twice: for the browser, into dist, and
// for Node (`--ssr`, into dist-ssr), the app that scripts/prerender.mjs
// renders into each page's HTML. The second build carries only what
// rendering needs: Vex's knowledge and the server's settings are the
// browser build's, and the prerender writes the pages, the sitemap and the
// routes in serve.json.
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    markdownQueries(),
    ...(isSsrBuild
      ? []
      : [vexKnowledge(), securityHeaders(loadEnv(mode, process.cwd()).VITE_API_BASE_URL?.trim())]),
    react(),
  ],
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
