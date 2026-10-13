import { buildUrl } from "../config/endpoints";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function resolvePreferredLanguage(): string {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("language");
      if (saved === "en" || saved === "pl") return saved;
    }
  } catch (_error) {
    // ignore
  }
  if (typeof navigator !== "undefined") {
    const raw =
      Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];
    const primary = (raw[0] || "en").toLowerCase();
    return primary.startsWith("pl") ? "pl" : "en";
  }
  return "en";
}

type FetchOptions<TBody> = {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

type JsonValue = unknown;

/** A response outside 2xx, keeping the status, body and headers for callers that tell failures apart. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  readonly headers: Headers;

  constructor(status: number, statusText: string, body: string, headers: Headers = new Headers()) {
    super(`HTTP ${status} ${statusText}: ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

export async function apiFetch<TResponse extends JsonValue, TBody extends JsonValue = undefined>(
  path: string,
  options: FetchOptions<TBody> = {},
): Promise<TResponse> {
  const { method = "GET", body, headers, query, signal } = options;
  const url = buildUrl(path, query);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const computedHeaders: Record<string, string> = {
    ...(headers || {}),
  };
  if (!("Accept-Language" in computedHeaders)) {
    computedHeaders["Accept-Language"] = resolvePreferredLanguage();
  }
  if (!isFormData) {
    computedHeaders["Content-Type"] = computedHeaders["Content-Type"] || "application/json";
  }
  const init: RequestInit = {
    method,
    headers: computedHeaders,
    signal,
  };

  if (body !== undefined) {
    init.body = isFormData ? (body as unknown as FormData) : JSON.stringify(body);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(response.status, response.statusText, text, response.headers);
  }
  // Try to parse JSON; fallback to empty as unknown
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as TResponse;
  }
  return (await response.text()) as unknown as TResponse;
}

export const apiClient = {
  get: <T>(path: string, query?: FetchOptions<never>["query"]) =>
    apiFetch<T>(path, { method: "GET", query }),
  /**
   * A list as the backend stores it, the same whatever the site's language:
   * every translation included, and the few labels the backend would
   * translate itself (a degree, a season, a skill's level) left in English
   * for the site to translate. Fetched once, it serves both languages
   * (see lib/queries.ts). This rests on the backend's English label for a
   * choice being the stored value itself ("Doctoral Studies", "Winter"),
   * which is what the site's own maps key on.
   */
  getList: <T>(path: string) =>
    apiFetch<T>(path, { method: "GET", headers: { "Accept-Language": "en" } }),
  post: <T, B = unknown>(path: string, body?: B) => apiFetch<T, B>(path, { method: "POST", body }),
  put: <T, B = unknown>(path: string, body?: B) => apiFetch<T, B>(path, { method: "PUT", body }),
  patch: <T, B = unknown>(path: string, body?: B) =>
    apiFetch<T, B>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
