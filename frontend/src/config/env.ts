export type AppEnv = {
    apiBaseUrl: string
    mock: boolean
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value == null) return defaultValue
    const normalized = value.trim().toLowerCase()
    return ["1", "true", "yes", "y", "on"].includes(normalized)
}

export const env: AppEnv = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    mock: parseBoolean(import.meta.env.VITE_MOCK, false),
}

if (!env.apiBaseUrl && !env.mock) {
    // eslint-disable-next-line no-console
    console.warn("VITE_API_BASE_URL is empty. Set it in .env.local or enable VITE_MOCK=true for local mocks.")
}


