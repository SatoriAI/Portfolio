import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

import { markdownQueries } from "./markdownQueries.ts";

// Kept separate from vite.config.ts so the app build stays free of test config.
export default defineConfig({
  // The workshop's lists read its pieces through the build's own query.
  plugins: [markdownQueries()],
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  resolve: {
    alias: {
      // Not __dirname: Vite warns that it is unsupported under the native
      // config loader. Resolving from the module URL works on every Node the
      // project supports, without depending on import.meta.dirname.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // The suite currently covers pure logic only, so it needs no DOM. Add
    // environment: "jsdom" (and jsdom itself) when component tests arrive.
    environment: "node",
    include: ["src/**/*.test.ts"],
    // config/env.ts throws at import time when this is unset, and the service
    // tests import it transitively; no test makes a real request to it.
    env: { VITE_API_BASE_URL: "http://localhost:8000" },
  },
});
