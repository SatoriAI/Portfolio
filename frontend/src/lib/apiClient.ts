import { env } from "../config/env"
import { buildUrl } from "../config/endpoints"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type FetchOptions<TBody> = {
    method?: HttpMethod
    body?: TBody
    headers?: Record<string, string>
    query?: Record<string, string | number | boolean | undefined | null>
}

type JsonValue = unknown

export async function apiFetch<TResponse extends JsonValue, TBody extends JsonValue = undefined>(
    path: string,
    options: FetchOptions<TBody> = {},
): Promise<TResponse> {
    if (env.mock) {
        // In mock mode, we do not call the backend.
        // The calling code should bypass apiFetch and use local sample data.
        throw new Error(
            "apiFetch called while VITE_MOCK=true. Use local example values instead of making requests.",
        )
    }

    const { method = "GET", body, headers, query } = options
    const url = buildUrl(path, query)
    const init: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    }

    if (body !== undefined) {
        init.body = JSON.stringify(body)
    }

    const response = await fetch(url, init)
    if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`)
    }
    // Try to parse JSON; fallback to empty as unknown
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
        return (await response.json()) as TResponse
    }
    return (await response.text()) as unknown as TResponse
}

export const apiClient = {
    get: <T>(path: string, query?: FetchOptions<never>["query"]) =>
        apiFetch<T>(path, { method: "GET", query }),
    post: <T, B = unknown>(path: string, body?: B) =>
        apiFetch<T, B>(path, { method: "POST", body }),
    put: <T, B = unknown>(path: string, body?: B) =>
        apiFetch<T, B>(path, { method: "PUT", body }),
    patch: <T, B = unknown>(path: string, body?: B) =>
        apiFetch<T, B>(path, { method: "PATCH", body }),
    delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
}

