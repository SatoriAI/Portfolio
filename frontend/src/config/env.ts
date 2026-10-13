export type AppEnv = {
  apiBaseUrl: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// Every page reads from the API, so a build without its address cannot work.
// Failing here, at import, names the cause on startup; a warning would only
// be followed by a less legible crash on the first request.
if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Set it to the backend origin (e.g. http://localhost:8000) in frontend/.env.local, or pass it as a build argument; Vite inlines it at build time.",
  );
}

export const env: AppEnv = { apiBaseUrl };
