---
title: tURL
slug: turl
period: 2025-08 – 2025-09
status: live
role: backend, tests, CI, deployment and frontend–API integration; UI generated with Lovable
context: personal
stack: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, React, TypeScript, Vite, Tailwind CSS, Docker, Railway, Cloudflare
demo: https://turl.info
repository: https://github.com/SatoriAI/tURL
summary: tURL is a link shortener that lets you set an expiry date and choose a short code of 2, 4, 6 or 8 characters. You can check a link's status and change its settings at any time. All without creating an account.
---

# tURL

## Period and status

- First commit: 28 August 2025. Last commit: 2 September 2025, in both the backend and the frontend repository. The work took about six days.
- The service is live. On 1 October 2026, turl.info redirected to the app at app.turl.info, and the `/status` endpoint responded normally.
- Nothing has been committed since 2 September 2025, so the project has not been in active development since 2 September 2025.
- There was no planned launch date. Dawid deployed the service when it was ready, on 2 September 2025.

## Role and context

- **Backend:** commits come from Dawid and from the GitHub account SatoriAI, which owns the repositories. The SatoriAI commits are pull-request merges and the initial commit. SatoriAI is Dawid's own GitHub account, so the project was entirely solo; the repositories show no other contributors.
- **Frontend:** the interface was generated with Lovable, an AI app builder. Dawid connected it to the API, completed the translations, wired up the button links and set up the deployment.
- **What Dawid owned:** the API and its tests, CI, deployment configuration and the frontend–API integration. He shaped the interface mostly through prompts in Lovable.
- **Context:** a personal side project, built partly for fun and partly to learn and try out Lovable. The site has a "Donate" button linking to Buy Me a Coffee, and footer links to Dawid's personal website and X account.
- The code is public on GitHub in two repositories: the backend (https://github.com/SatoriAI/tURL) and the frontend (https://github.com/SatoriAI/tURL-UI).
- Licence: MIT.

## Short summary

tURL is a link shortener with expiry. You paste a long address, choose how long the link should last (from one day to forever) and how long its code is: 2, 4, 6 or 8 characters. You get a short link with a copy button. Later you can check whether the link is still active and how many days it has left. You can extend it or remove its expiry. No account is needed.

## Problem

tURL was not built to fill a gap in existing shorteners; Dawid does not think they are missing anything. The interface describes the aim as creating short links with custom lifetimes: links that do not live forever by default, and can be kept alive when needed.

The service is for anyone who needs a link shortener. tURL offers two simple settings: expiry and code length.

## How it works for the user

1. You open turl.info and land on the app. It is in English or Polish, with a language switch and a light or dark theme.
2. In the shortening section you paste a long address.
3. You choose how long the link lasts: 1 day, 7 days, 30 days (the default), 1 year or forever.
4. You choose the code length: 2, 4, 6 (the default) or 8 characters. Each option shows roughly how many codes are available.
5. If the field is empty or the address is invalid, you see an error message.
6. After shortening you get a card with the original and the short link, a copy button, the chosen lifetime and the creation date.
7. Anyone who opens the short link goes straight to the original address. An unknown code returns "not found".
8. Later, in the status section, you paste the short link and see whether it is active, when it was created, its lifetime ("Infinite" if it never expires), the days left and where it points.
9. While the link is active, you can extend it by a chosen period or make it permanent.

No account is needed. Neither repository handles login or users.

## Technical description

**Two services:**

- A FastAPI API at turl.info. Its root redirects (308) to the frontend, so the short domain doubles as the brand address.
- A single-page React app at app.turl.info that calls the API from the browser. The API address is fixed into the bundle at build time.

**Data:** two PostgreSQL tables in a one-to-one relationship.

- `link`: the target address and a unique, indexed code.
- `detail`: code length, lifetime in days (NULL means forever), registration and modification dates. Deleted together with its link.
- CHECK constraints in the database: length above zero, lifetime either null or above zero.
- The expiry date is not stored. It is computed on read as registration date plus lifetime.

**Endpoints:**

- `POST /encode` creates a link and returns the short address.
- `GET /d/{code}` redirects (308) or returns 404.
- `GET /info/{code}` returns the address, dates, expiry and whether the link has expired.
- `PATCH /extend/{code}` adds days to the lifetime or makes it permanent.
- `GET /status` is the health check. Documentation (ReDoc) is at `/docs`; Swagger is turned off.

**How a create request travels:** CORS check (one allowed origin) and a global rate limit → Pydantic validates the URL and numbers → a random code from letters and digits → insert `link` and `detail`. If the code clashes, the insert is rolled back and a new code is drawn, up to 10 times by default. After that the API returns 406 and asks for a longer code.

**Stack:**

- Backend: Python 3.13, FastAPI, async SQLAlchemy 2 with asyncpg, Alembic, pydantic-settings (all configuration from environment variables), fastapi-throttle, Gunicorn with Uvicorn workers, uv.
- Frontend: React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, TanStack Query, React Router. EN/PL translations are a hand-written map, and the chosen language is saved in the browser.

## Engineering decisions

The repositories record no architecture decisions. The ones below come from the code, its comments and Dawid's own account. No alternatives were seriously weighed: tURL was a project built for fun.

- **The database enforces unique codes, not a separate lookup.** The API inserts straight away and relies on the UNIQUE constraint. A code comment calls this cheaper than checking first. It also removes the race between checking and inserting.
- **The user picks the code length, and running out of codes is reported.** The API does not lengthen the code itself; it returns 406 and suggests a longer one. The interface shows how many codes each length allows.
- **A lifetime instead of an expiry timestamp.** Extending is plain addition, and NULL cleanly means forever. The cost: expiry must be computed on every read, and the database cannot index it for clean-up.
- **Metadata in a separate table.** The split is deliberate: the redirect query reads only the narrow `link` table.
- **Locking on extend.** `SELECT … FOR UPDATE` inside a transaction stops two simultaneous extensions from overwriting each other.
- **Validation in two places.** Pydantic checks input at the API edge, and CHECK constraints enforce the same rules in the database.
- **308 redirects.** Short links and the root path use 308, and the tests assert it. Browsers may cache such a redirect, which sits awkwardly with expiring links. Dawid thinks he would change this now, though he does not see it as a big issue.
- **A global rate limit.** It covers every route and is set through environment variables.
- **Migrations before deployment.** Railway runs `alembic upgrade head` before the new version starts, not at app start-up.
- **Generated interface, hand-written integration.** Lovable generated the UI from Dawid's prompts; he wrote the API wiring, translations and deployment himself. The endpoints live in one config module.

## Running it in production

- **Hosting:** both services on Railway, each with its own Dockerfile and a config file in the repository. Traffic goes through Cloudflare.
- **API container:** `python:3.13-slim`, dependencies installed with uv and cached in Docker layers, Gunicorn with the worker count from an environment variable, health check on `/status`.
- **Frontend container:** a two-stage build. Node 20 builds the app and `serve` serves the output.
- **Database:** PostgreSQL from the latest image Railway provides. CI tests against PostgreSQL 17.
- **CI (backend only):** GitHub Actions on pushes and PRs to `main`: pre-commit (ruff, codespell, YAML and TOML checks), then pylint and mypy in parallel, then pytest against a PostgreSQL container. Coverage goes to Codecov, and tests fail below 85%. The tests cover every endpoint, including the 429 response when the rate limit is hit.
- **Frontend:** no CI in the repository.
- **Deployment:** Railway deploys automatically on every push.
- **Monitoring:** nothing in the repositories beyond the health check.
- **Costs:** under a dollar a month.
- **Incidents:** the only known one was a 500 error from `/info` on expired links, fixed in PR #6. Dawid knows of no others.

## Results

There are no figures: no user counts, links created, redirects served or uptime. The repository does not store a current coverage figure either; CI requires at least 85%. What can be checked is that the service is live and redirects to the app.

## Limitations and what's next

Neither repository has a roadmap or TODO notes. The gaps below come from reading the code; the plans come from Dawid.

- **Expiry does not block the redirect.** `GET /d/{code}` does not check expiry, and nothing deletes expired links, so in the deployed version an expired link still redirects. Expiry shows only in the status view. An error message about links that have been "revoked" has no matching code. Enforcing expiry on redirect is planned.
- **Extensions count from the creation date.** Days are added to the original lifetime, not from today. A short extension of an expired link may leave it expired, though the interface calls the choice a "new lifetime".
- **No click statistics,** although the interface copy mentions tracking links. Links cannot be deleted or edited. Expiry is counted in whole days.
- **The Dockerfile health check** calls `curl`, which is uninstalled earlier in the same image. Railway uses its own health check on `/status`.
- **Documentation:** the frontend README is the Lovable template, the backend README is one sentence, and the `pyproject.toml` description is still the template text.
- **Next steps:** enforcing expiry on redirect, and link ownership, so only a link's owner can change its details.
