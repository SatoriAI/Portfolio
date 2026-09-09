# Portfolio — Frontend

[![Build Status](https://github.com/SatoriAI/Portfolio/actions/workflows/frontend-quality.yml/badge.svg)](https://github.com/SatoriAI/Portfolio/actions/workflows/frontend-quality.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The public single-page app for the portfolio: a Vite + React + TypeScript site styled with Tailwind and shadcn/ui, and the chat client for Vex.

For the combined quick start, see the [repository README](../README.md).

## Commands

```bash
npm ci             # install
npm run dev        # serve on :8080
npm run build      # production bundle into dist/ (this is where tsc runs)
npm run lint       # eslint
npm run format     # prettier --write
```

## Layout

Three routes — `/`, `/experience` and `/academic` — in `src/pages/`, on top of a thin data layer:

- `src/config/endpoints.ts` — every backend route, in one place
- `src/lib/*Service.ts` — one module per domain, mapping the API's `translations` payloads onto UI types
- `src/contexts/SettingsContext.tsx` — theme (dark by default) and language (`en`/`pl`), persisted in `localStorage`

There is no i18n library. Localised content comes from the backend's `django-parler` translations, and the chosen language is forwarded as an `Accept-Language` header by `src/lib/apiClient.ts`.

### ChatWidget

[`src/components/ChatWidget.tsx`](src/components/ChatWidget.tsx) POSTs to `/api/vex/chat/` for a session key, then opens an `EventSource` against `/api/vex/chat/stream/` and renders the token stream as Markdown. Most of its bulk is stream defence: SSE payloads arrive in several shapes, and Markdown split across chunk boundaries has to be repaired mid-flight — unclosed code fences, headings and list items severed from their newlines — before a final cleanup pass once the stream closes.

## Configuration

Copy `.env.example` to `.env.local`:

| Variable            | Meaning                                                       |
| ------------------- | ------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Backend origin, e.g. `http://localhost:8000`                  |
| `VITE_MOCK`         | When true, render from local sample data and make no requests |

Vite inlines both at build time, so changing either needs a rebuild rather than a restart. In Docker they are build arguments for the same reason.

## Testing

```bash
npm test          # vitest, single run
npm run test:watch
```

[Vitest](https://vitest.dev) covers the pure logic: the SSE decoding and markdown repair in `src/lib/streamMarkdown.ts`, and the locale fallbacks in the service mappers. It runs in the `node` environment because nothing under test needs a DOM — add `jsdom` when component tests arrive.

Two tests in `streamMarkdown.test.ts` are marked `it.fails`. They are not flaky: they document real defects in the markdown repair, and are written so that fixing the code turns the suite red and prompts flipping them back to `it`.

CI also runs ESLint, a Prettier check, and the production build, which is what typechecks the project.
