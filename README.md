# Portfolio

Dawid Hanrahan's personal portfolio: a Django REST API and the React single-page app that consumes it, including **Vex** — a retrieval-augmented chat assistant that answers questions about the portfolio's own content, streaming its replies over SSE.

[![Backend](https://github.com/SatoriAI/Portfolio/actions/workflows/backend-quality.yml/badge.svg)](https://github.com/SatoriAI/Portfolio/actions/workflows/backend-quality.yml)
[![Frontend](https://github.com/SatoriAI/Portfolio/actions/workflows/frontend-quality.yml/badge.svg)](https://github.com/SatoriAI/Portfolio/actions/workflows/frontend-quality.yml)
[![Coverage Status](https://codecov.io/gh/SatoriAI/Portfolio/branch/main/graph/badge.svg)](https://codecov.io/gh/SatoriAI/Portfolio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Status

Live and maintained. Both halves deploy to Railway from this repository.

## Layout

A monorepo of two projects that are always developed together. Each half keeps its own toolchain, dependencies, Dockerfile and deployment config; only what genuinely spans both lives at the root.

| Path | Project | Stack |
| --- | --- | --- |
| [`backend/`](./backend) | REST API, admin, and the Vex RAG pipeline | Python 3.13 · Django 5.2 · DRF · PostgreSQL + pgvector · `uv` |
| [`frontend/`](./frontend) | The public single-page app | React 18 · TypeScript · Vite · Tailwind · shadcn/ui |

```
.
├── backend/            # Django project, .railway/ deploy config, tools/chat-tester
├── frontend/           # Vite SPA
├── docker-compose.yml  # both halves plus a pgvector Postgres
├── lefthook.yml        # commit hooks for both ecosystems
└── .github/workflows/  # backend-quality · frontend-quality · hygiene
```

The repository has two root commits. That is deliberate: the frontend was developed in its own repository for a year, and its history was rewritten into `frontend/` and merged rather than copied, so `git blame` and `git log --follow` still work across the join.

## Quick start

```bash
cp backend/.env.example backend/.env   # fill in SECRET_KEY and OPENAI_API_KEY
docker compose up
```

That brings up the frontend on `:8080`, the API on `:8000` (admin at `/admin/`, OpenAPI docs at `/api/docs/`) and Postgres with pgvector on `:5432`. On a fresh database, create the schema and a login:

```bash
docker compose exec backend python portfolio/manage.py migrate
docker compose exec backend python portfolio/manage.py createsuperuser
```

To run either half directly instead of in Docker, you need a Postgres with the `vector` extension available:

```bash
cd backend && uv sync --group dev && uv run python portfolio/manage.py runserver
cd frontend && npm ci && npm run dev
```

## Configuration

The backend reads its settings from `backend/.env`; every key is listed with its default in [`backend/.env.example`](./backend/.env.example). Four have no default and Django will not start without them: `SECRET_KEY`, `DATABASE_URL`, `VECTOR_DB_COLLECTION` and `OPENAI_API_KEY`. Compose overrides `DATABASE_URL`, `DEBUG` and `USE_S3` with local values, so a `.env` pointing at Railway cannot reach production by accident.

The frontend takes `VITE_API_BASE_URL` and `VITE_MOCK` (see [`frontend/.env.example`](./frontend/.env.example)). Vite inlines these at build time, so changing either needs a rebuild rather than a restart.

## Commit hooks

One [Lefthook](https://lefthook.dev) config covers both halves — ruff, bandit and codespell on Python, ESLint and Prettier on TypeScript, each scoped by path so a backend commit never waits on Node. Once per clone:

```bash
brew install lefthook && lefthook install
```

## CI

Three workflows. `backend-quality` and `frontend-quality` are path-filtered, so a change to one half does not run the other's suite; `hygiene` runs the Lefthook suite over the whole repository on every change. See [`.github/workflows/`](./.github/workflows).

## Deployment

Both halves run on Railway in the shared `Mark 0` project, each as its own service built from this repository with a Root Directory of `backend` or `frontend`. The `.railway/*.toml` files in each half document the build and start commands but are no longer read by the platform — Railway's Config as Code is deprecated, and the live settings are in the dashboard.
