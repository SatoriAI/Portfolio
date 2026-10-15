/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

/** The year the site was built in (vite.config.ts), as its prerendered pages state it. */
declare const __BUILD_YEAR__: number;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
