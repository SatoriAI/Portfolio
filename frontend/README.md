# Portfolio — Frontend

[![Build Status](https://github.com/SatoriAI/Portfolio/actions/workflows/frontend-quality.yml/badge.svg)](https://github.com/SatoriAI/Portfolio/actions/workflows/frontend-quality.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The public single-page app for the portfolio: a Vite + React + TypeScript site styled with Tailwind and shadcn/ui, and the chat client for Vex.

For the combined quick start, see the [repository README](../README.md).

## Commands

Run these from the repository root, where the [`Makefile`](../Makefile) holds the single
definition of each one — CI calls the same targets, so the two cannot drift.

- Install: `make install-frontend`
- Tests: `make test-frontend`
- Lint and formatting: `make lint-frontend`, `make format-frontend`
- Build, which is also what typechecks the project: `make build`

Serving and auto-formatting stay local to this directory:

```bash
cd frontend && npm run dev      # :8080
cd frontend && npm run format   # prettier --write
```

## Layout

Three routes — `/`, `/experience` and `/academic` — in `src/pages/`, on top of a thin data layer:

- `src/config/endpoints.ts` — every backend route, in one place
- `src/lib/*Service.ts` — one module per domain, mapping the API's `translations` payloads onto UI types
- `src/contexts/SettingsContext.tsx` — language (`en`/`pl`), persisted in `localStorage`
- `src/config/navigation.ts` — the header's links, shared by the desktop nav and the mobile sheet
- `src/utils/translations.ts` — all site copy in both languages, including per-page titles (`usePageMeta`)

Pages are composed from `src/components/layout/` (header, footer, `Section`, `SectionHeading`), the cards in `src/components/cards/` (one per backend domain type), and `SwipeCarousel`, the phone-only one-slide-at-a-time carousel. The shadcn primitives stay in `src/components/ui/`. The home page is in the main bundle; the other routes and the chat's Markdown renderer load lazily.

There is no i18n library. Localised content comes from the backend's `django-parler` translations, and the chosen language is forwarded as an `Accept-Language` header by `src/lib/apiClient.ts`.

### ChatWidget

[`src/components/ChatWidget.tsx`](src/components/ChatWidget.tsx) POSTs to `/api/vex/chat/` for a session key, then opens an `EventSource` against `/api/vex/chat/stream/` and renders the token stream as Markdown. Most of its bulk is stream defence: SSE payloads arrive in several shapes, and Markdown split across chunk boundaries has to be repaired mid-flight — unclosed code fences, headings and list items severed from their newlines — before a final cleanup pass once the stream closes. Thirty seconds of silence, before the first token or between tokens, is treated as a failure and shown inline with an email fallback, so a broken backend never looks like a page that is merely slow.

### Visual identity

The site implements Dawid's Visual Identity Kit ("Binary Axis", v5), which is versioned alongside the code in [`../visual-kit/`](../visual-kit/README.md) — read that first when adding colours, type, motion or decoration. It gives a single light palette, Manrope for text and IBM Plex Mono for tags, dates and labels, a 1160 px content column, and two decorative motifs. Everything lives in three places:

- `src/index.css` — the palette as HSL variables (`--ink`, `--lavender`, `--iris`, …) mapped onto the shadcn semantic names the `ui/` primitives consume, plus the `@font-face` rules
- `tailwind.config.ts` — the same tokens exposed as Tailwind colours, the kit's type scale (`text-display`, `text-h2`, `text-card-title`, …), the 20 px card radius and the reveal easing
- `src/components/brand/` — the `dh` mark drawn inline, the geometric `RhythmMotif` band and the `DiffusionField` colour field

The mark reduces the initials to `0 · 1 → dh`: the bowl of the `d` reads as zero, the shared vertical as one, and one curve completes the `h`. `BrandSymbol` carries both of the kit's cuts and picks between them by size — below 32 px the kit requires a separate, heavier micro drawing rather than a scaled-down standard one, so no call site has to remember that. `BrandLogo` sets the wordmark from the master artwork's proportions, so the lockup stays correct at any size.

The kit defines no dark theme, so the site has none; adding one later means a second variable block in `src/index.css`, nothing else. It also leaves semantic error and success colours undefined — `--destructive` is a placeholder used only for error copy. Fonts are self-hosted from `public/fonts/` with their OFL licences, and the favicon set and manifest in `public/` are copied from `../visual-kit/favicon/`.

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

The markdown repair applies its rules to prose only: fenced code blocks are lifted out before the rules run and put back afterwards, so code is reproduced literally. `streamMarkdown.test.ts` covers that boundary from both sides, and asserts that `normalizeMarkdown` is idempotent — it runs on every render, so applying it to its own output must change nothing.

CI also runs ESLint, a Prettier check, and the production build, which is what typechecks the project.
