import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so the app build stays free of test config.
export default defineConfig({
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
    // config/env.ts warns at import time when this is unset; the service
    // tests import it transitively and the warning is noise, not a signal.
    env: { VITE_API_BASE_URL: "http://localhost:8000" },
  },
});
