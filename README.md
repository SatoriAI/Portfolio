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

```text
backend/            Django project, .railway/ deploy config, tools/chat-tester
frontend/           Vite SPA
Makefile            every command this repository runs
docker-compose.yml  both halves plus a pgvector Postgres
lefthook.yml        commit hooks for both ecosystems
```

The repository has two root commits. That is deliberate: the frontend was developed in its own repository for a year, and its history was rewritten into `frontend/` and merged rather than copied, so `git blame` and `git log --follow` still work across the join.

## Quick start

Requires Docker and an [OpenAI API key](https://platform.openai.com/api-keys) if you want Vex to answer; everything else runs without one.

```bash
cp backend/.env.example backend/.env   # then fill in SECRET_KEY and OPENAI_API_KEY
docker compose up -d
docker compose exec backend python portfolio/manage.py migrate
```

**The migrate step is required, not optional.** Until it runs, the API and `/healthcheck/` both return 500 — the containers are up but the schema does not exist yet.

That leaves the frontend on `:8080`, the API on `:8000` (admin at `/admin/`, OpenAPI docs at `/api/docs/`) and Postgres with pgvector on `:5432`.

A fresh database has **no portfolio content**, so every endpoint returns `[]` and the site renders empty. Add content through the admin:

```bash
docker compose exec backend python portfolio/manage.py createsuperuser
```

To run either half outside Docker you need a Postgres that has the `vector` extension available — a stock Postgres will not do:

```bash
make install                                        # both halves
cd backend && uv run python portfolio/manage.py runserver
cd frontend && npm run dev
```

## Commands

Every command lives in the [`Makefile`](./Makefile), which is what CI runs too, so the two cannot drift. `make help` lists them all; these are the ones used most:

- Run everything CI runs: `make check`
- Backend tests, with the 85% coverage gate: `make test-backend`
- Frontend tests: `make test-frontend`
- Types: `make typecheck`
- Compile the Polish catalogue after editing `.po` files: `make translations`

## Configuration

The backend reads `backend/.env`; every key is listed with its default in [`backend/.env.example`](./backend/.env.example).

| Name | Required | Used for |
| --- | --- | --- |
| `SECRET_KEY` | Yes | Django signing; no default |
| `DATABASE_URL` | Yes | Application database; compose supplies a local one |
| `VECTOR_DB_COLLECTION` | Yes | Name of the pgvector collection holding Vex's embeddings |
| `OPENAI_API_KEY` | Yes | Vex only; Django will not start without it, but nothing else uses it |
| `USE_S3` | No | Media to object storage. Defaults to the inverse of `DEBUG` |

Compose overrides `DATABASE_URL`, `DEBUG` and `USE_S3` with local values, so a `.env` pointing at Railway cannot reach production by accident.

The frontend takes `VITE_API_BASE_URL` and `VITE_MOCK` (see [`frontend/.env.example`](./frontend/.env.example)). Vite inlines these at build time, so changing either needs a rebuild rather than a restart.

## Limitations and assumptions

- **Vex needs an OpenAI key with credit on it.** Without one the SSE stream opens and then delivers an error event rather than an answer — `401` for a bad key, `429 insufficient_quota` when the account is out of credit. The rest of the site is unaffected.
- **The database must have pgvector.** Compose and CI both provide it; a stock Postgres image cannot run the vector store.
- **Content lives in the database, not in the repository**, so a fresh checkout has an empty site and there is no seed fixture.
- **Media requires object storage in production.** With `USE_S3` on, the `BUCKET_*` variables are all required.
- **Frontend tests cover pure logic only** — the SSE decoding, markdown repair and locale mappings. There are no component or end-to-end tests, and `npm run build` is what typechecks the project.

## Commit hooks

One [Lefthook](https://lefthook.dev) config covers both halves — ruff, bandit and codespell on Python, ESLint and Prettier on TypeScript, each scoped by path so a backend commit never waits on Node. Once per clone:

```bash
brew install lefthook   # or: npm install -g lefthook, or see lefthook.dev/installation
lefthook install
```

## CI

Three workflows under [`.github/workflows/`](./.github/workflows). `backend-quality` and `frontend-quality` are filtered by path, so a change to one half does not run the other's suite. `hygiene` is unfiltered and runs the Lefthook suite with `--tag backend --tag repo`; the frontend hooks are deliberately excluded because `frontend-quality` already owns that verdict.

Actions are pinned to commit SHAs and bumped by [Dependabot](./.github/dependabot.yml).

## Deployment

Both halves run on Railway in the shared `Mark 0` project, each as its own service built from this repository with a Root Directory of `backend` or `frontend`.

The `.railway/*.toml` file in each half **is read by the platform** and is load-bearing: a service whose configured path does not resolve fails at `SNAPSHOT_CODE` with `service config not found`, before any build starts. The path is resolved from the **repository root**, not from the service's Root Directory, so it is stored as `backend/.railway/portfolio.toml` rather than `.railway/portfolio.toml`.

## For agents

Commands live in the `Makefile` — prefer a target over retyping its contents, because CI calls the same targets and a second spelling is what drifts. Do not hand-edit `backend/uv.lock`, `frontend/package-lock.json` or the compiled `.mo` catalogues; regenerate them with `uv sync`, `npm install` and `make translations`.
