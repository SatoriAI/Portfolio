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
| [`backend/`](./backend) | REST API, admin, and the Vex assistant | Python 3.13 · Django 5.2 · DRF · PostgreSQL · `uv` |
| [`frontend/`](./frontend) | The public single-page app | React 18 · TypeScript · Vite · Tailwind · shadcn/ui |

```text
backend/            Django project, tools/chat-tester
frontend/           Vite SPA
.railway/           Railway settings for both services
Makefile            every command this repository runs
docker-compose.yml  both halves plus a Postgres
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

That leaves the frontend on `:8080`, the API on `:8000` (admin at `/admin/`, OpenAPI docs at `/api/docs/`) and Postgres on `:5432`.

A fresh database has **no portfolio content**, so every endpoint returns `[]` and the site renders empty. Add content through the admin:

```bash
docker compose exec backend python portfolio/manage.py createsuperuser
```

To run either half outside Docker you need a Postgres of your own:

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
| `OPENAI_API_KEY` | Yes | Vex only; Django will not start without it, but nothing else uses it |
| `USE_S3` | No | Media to object storage. Defaults to the inverse of `DEBUG` |
| `VEX_MODEL`, `VEX_REASONING_EFFORT` | No | Vex's OpenAI model and its reasoning effort; `gpt-6-luna` and `low` by default |
| `VEX_DAILY_BUDGET_USD` | No | What Vex may spend on the model per UTC day; `5.00` by default. Once reached, Vex rests until midnight UTC and offers Dawid's email instead |
| `VEX_CONVERSATION_RETENTION_DAYS` | No | How long Vex keeps a conversation after its last question; `730` (24 months) by default, which the chat's notice promises. Under 1 refuses to start |
| `REDIS_URL` | No | Where Vex keeps its rate-limit counts and the day's spend, shared by every worker; without it they live in each process's memory |
| `VEX_REDIS_DB` | No | The Redis database Vex uses when `REDIS_URL` names none; `5` by default |
| `VEX_SITE_CONTENT_URL` | No | The site's origin, where Vex fetches `/vex-kb/<pl\|en>.json`; `http://localhost:8080` with `DEBUG`, otherwise empty |

Compose overrides `DATABASE_URL`, `DEBUG` and `USE_S3` with local values, so a `.env` pointing at Railway cannot reach production by accident.

The frontend takes `VITE_API_BASE_URL` (see [`frontend/.env.example`](./frontend/.env.example)). Vite inlines it at build time, so changing it needs a rebuild rather than a restart.

## Limitations and assumptions

- **Vex needs an OpenAI key with credit on it.** Without one the SSE stream opens and then delivers an error event rather than an answer — `401` for a bad key, `429 insufficient_quota` when the account is out of credit. The rest of the site is unaffected.
- **Vex reads the site's Markdown from the deployed frontend.** The frontend's build publishes it as `/vex-kb/<pl|en>.json`; without `VEX_SITE_CONTENT_URL`, or with the site down, Vex answers from the database alone.
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

Their settings are declared in [`.railway/railway.ts`](./.railway/railway.ts), Railway's Infrastructure as Code. Railway does not read that file during a deploy: the CLI evaluates it and applies the difference, so a change to it takes effect when someone applies it, not when it merges. It is a named partial (`portfolio`) because `Mark 0` also runs other repositories' apps, and it owns only the two Portfolio services. Every variable either service holds is listed by name with `preserve()`, which keeps its value on Railway and out of this repository; a name the file leaves out is deleted on apply, so set a new variable in Railway and add its name here.

```bash
npm ci --prefix .railway                     # the SDK the CLI resolves railway/iac from
npx -y @railway/cli@5.71.0 config plan       # read-only: what would change
npx -y @railway/cli@5.71.0 config apply      # change Railway to match the file
```

The CLI and the SDK in `.railway/package.json` are pinned together; bump them as a pair, since a newer CLI can read the same file differently. Treat a plan line reading `Delete variable` as a stop.

Until the cutover, both services still read the Config as Code file in their half (`backend/.railway/portfolio.toml`, `frontend/.railway/portfolio-ui.toml`), which overrides the dashboard values the plan compares against. Those files are load-bearing until then: a service whose configured path does not resolve fails at `SNAPSHOT_CODE` with `service config not found`, before any build starts. Railway stops reading them on 2026-12-01.

## For agents

Commands live in the `Makefile` — prefer a target over retyping its contents, because CI calls the same targets and a second spelling is what drifts. Do not hand-edit `backend/uv.lock`, `frontend/package-lock.json` or the compiled `.mo` catalogues; regenerate them with `uv sync`, `npm install` and `make translations`.
