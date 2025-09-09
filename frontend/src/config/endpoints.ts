import { env } from "./env"

type QueryParams = Record<string, string | number | boolean | undefined | null>

export const endpoints = {
    // Define logical endpoints here. We'll wire them in later.
    health: "/health",
    // Example namespaces for future expansion
    projects: {
        list: "/projects",
        byId: (id: string | number) => `/projects/${id}`,
    },
    skills: {
        list: "/skills",
    },
    work: {
        projects: {
            list: "/api/work/projects/",
        },
        skills: {
            list: "/api/work/skills/",
        },
        experiences: {
            list: "/api/work/experiences/",
        }
    },
    education: {
        schools: {
            list: "/api/university/schools/",
        },
        publications: {
            list: "/api/university/publications/",
        },
        testimonials: {
            list: "/api/university/testimonials/",
        }
    }
} as const

export function buildUrl(path: string, query?: QueryParams): string {
    const base = env.apiBaseUrl.replace(/\/$/, "")
    const url = new URL(`${base}${path}`)
    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value === undefined || value === null) return
            url.searchParams.set(key, String(value))
        })
    }
    return url.toString()
}

