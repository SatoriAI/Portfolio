---
title: Picko
slug: picko
period: 2025-12 – ongoing
status: live
role: solo: frontend, backend, database, email, deployment
context: personal
stack: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Celery, Redis, SvelteKit, TypeScript, Tailwind CSS, Resend, Docker, Railway, Cloudflare
demo: https://picko.world
repository: https://github.com/SatoriAI/Picko
summary: Picko grew out of a need to organise a simple Secret Santa draw with friends. Create a draw, set a sign-up deadline and an optional gift price limit, then share the link with participants. Everyone can sign up without an account and add a wishlist. When sign-ups close, participants get the results of the draw by email.
---

# Picko

## Period and status

- First commit: 1 December 2025. Nearly every feature was built between 13 and 20 December 2025.
- The site went public at the beginning of December 2025. Dawid does not remember the exact date.
- After that, maintenance only: support for several frontend origins (CORS) on 26 August 2026, and a move to a single web worker on 1 September 2026. That is the last commit.
- Status: live at https://picko.world, in English and Polish.
- It is a seasonal app. The Christmas theme is switched on by an environment variable, and a commit notes that outside December Picko serves a handful of requests a day.
- The site was already in use in the 2025 season. Dawid mentions real cases that had to be handled with the command-line tools (see "Manual operations").

## Role and context

- Solo project. Dawid Hanrahan wrote all 44 commits: the frontend, backend, database, email sending, Christmas theme, deployment files and command-line tools.
- 42 commits are under his name. The other two (the initial commit on 1 December 2025 and the merge of pull request #1 on 26 August 2026) come from SatoriAI, his personal GitHub account, which owns the repository. The only other author is Dawid's AI assistant, which co-authored the CORS and single-worker commits.
- The site footer reads "Created by Dawid Hanrahan". The code is MIT-licensed.
- Personal project. Dawid built Picko for his friends. Other people use the site too, which he is glad to see. The site describes the service as free to use.

## Short summary

Picko is a free Secret Santa app for friends, families and coworkers. An organiser creates a draw, sets a sign-up deadline and, optionally, a gift price limit, then shares one link. Participants sign up without an account and can add a wishlist. At the deadline the draw runs by itself, and each person learns whom they are buying for and sees that person's wishlist.

## Problem

A group of friends, a family or a team at work wants to run Secret Santa. The draw has to stay secret, and nobody should have to sign up for anything. As the README puts it, what was missing was a quick way to create a draw, collect participants and send each one a personal link, with no accounts and no friction.

In Dawid's view, the existing Secret Santa tools were simply too complicated. Picko was meant to be simpler.

## How it works for the user

1. **The organiser creates an event.** They enter a name and a registration deadline. They can also set a maximum gift price (PLN, USD or EUR) and an event date.
2. **The organiser can sign up too.** After creating the event, they land straight on its sign-up page.
3. **Participants sign themselves up.** The organiser copies the registration link and sends it to the group. Each person enters:
   - their name,
   - an email address (optional), where the result will be sent,
   - a language: English or Polish,
   - a wishlist (optional, items separated by commas).
4. **Everyone gets a personal page ("My card").** It shows a countdown to the draw and asks them to bookmark the page.
5. **The event page.** It shows the registration link, a countdown, and everyone registered so far with their wishlists. A button on each participant's card leads there.
6. **The draw runs by itself at the deadline.** Nobody has to press anything. Nobody can draw themselves. At least two people are needed. With fewer, everyone sees that the draw could not happen and is asked to contact the organiser.
7. **The reveal.** People who gave an email get a message in their language with a personal link. That link, or the bookmarked card, opens an animated gift box showing:
   - whom you are buying for,
   - that person's wishlist,
   - the budget and the event date,
   - a reminder to keep it secret.

   There is also an "Add to calendar" link for Google Calendar.

8. **Language and look.** The interface is in English and Polish and follows the browser's language. It has a light/dark switch and a Christmas theme.

## Technical description

**Four parts.**

- A SvelteKit server (Svelte 5, TypeScript, Tailwind CSS 4, adapter-node).
- A FastAPI API (Python 3.13) with async SQLAlchemy 2, asyncpg and Alembic migrations.
- A Celery worker, with Redis as the broker.
- PostgreSQL and Redis.

**How a request travels.** The browser never calls the API directly. It calls `/api/...` routes on the same SvelteKit server, which forward the request to the backend. Only the method, body and content type are passed on.

**Data model.** Four tables:

- **Event:** name, optional date, budget (amount and currency: EUR, PLN or USD), registration deadline, registration token, a draw-complete flag and a notified-at timestamp.
- **Participant:** name (unique within the event), optional email, language, a wishlist of up to 1000 characters, and a personal access token.
- **Draw:** one per event.
- **Assignment:** who gives to whom, with its own reveal token.

The database enforces correctness itself. A CHECK constraint rules out drawing yourself, and UNIQUE constraints make sure each person gives once and receives once.

**Links instead of accounts.** Each role gets a link with a random token (`secrets.token_urlsafe(32)`):

- the organiser: a registration link,
- each participant: a personal status page,
- each giver: a reveal link with the receiver's name, wishlist and the budget.

**Draw flow.**

- Creating an event schedules a Celery task with a countdown equal to the time until the deadline, plus 5 seconds.
- The task locks the event row (`SELECT … FOR UPDATE`) and draws only if the deadline has passed and at least two people have signed up.
- It then emails each participant who gave an address their reveal link, in their language. People without an email are skipped.
- If the task has not run yet, the first read of the event or a participant page after the deadline runs the draw inline.

**Algorithm.** Rejection sampling: shuffle and retry until nobody is matched with themselves, which gives a uniformly random derangement. The shuffle uses `random.shuffle`. `secrets` is used only for the link tokens.

**Email.** A small in-house client sends mail through Resend's REST API. Each message has an HTML part from per-language templates (values are escaped) and a plain-text part. It retries on 408, 425, 429, 500, 502, 503 and 504 responses and on network errors. It honours `Retry-After`, and otherwise backs off exponentially with jitter (6 retries by default, from 0.5 s up to 20 s).

**Other parts.**

- A `picko` command-line tool: `set-deadline` moves the deadline and reschedules the draw, and `resend-email` re-sends one person's result.
- `GET /status` for health checks, and API docs in ReDoc at `/docs`.
- Languages are handled by Paraglide (inlang). The reveal page has a gift-box animation, confetti and a countdown.

## Engineering decisions

- **The draw runs in a background job, not in the request.** Celery handles the draw and the emails, so a slow email provider never holds a web request open. This is why one web worker is enough.
- **A countdown, not a fixed time.** The task is scheduled with a delay in seconds rather than a clock time, to avoid timezone pitfalls. Naive datetimes are treated as UTC everywhere.
- **Fixing a race in the draw (20 December 2025).** One commit made three changes: a `notified_at` column, a row lock with an early exit when notifications have already gone out, and a 14-day Redis `visibility_timeout`. As far as Dawid recalls, the fix came out of a code review rather than an incident. The likely risk was that Redis redelivers tasks with long countdowns, which could have duplicated draws or emails.
- **The draw also runs on read.** A lost Celery task does not leave participants without a result. The cost: the draw can now start from two places, and the read path takes no lock.
- **Correctness in the database, not only in code.** CHECK and UNIQUE constraints make invalid assignments impossible. A duplicate name within an event returns HTTP 409.
- **Links instead of accounts.** Access relies on unguessable tokens, a separate one per role.
- **The frontend server as the API proxy.** The browser talks only to the SvelteKit server, so the API stays hidden from users. For Dawid, that was a core requirement for this app.
- **An in-house Resend client instead of the SDK.** It handles 429 responses and `Retry-After` explicitly. It was not a reaction to gaps in the official SDK: Dawid wrote it for the enjoyment of doing a piece of engineering properly.
- **Multiple CORS origins.** Previously, the whole environment variable became a one-item list, so the API could serve exactly one frontend. Moving domains would have meant a hard cutover with no overlap. The variable is now split on commas.
- **One Gunicorn worker.** A second worker held memory for traffic that never came, and Railway bills reserved RAM per second. One worker means one request at a time, which is enough because the draw runs in Celery.

## Running it in production

- **Hosting:** Railway, with three services built from Dockerfiles and defined in `.railway/*.toml`: `backend` (FastAPI with Gunicorn), `celery` (the worker) and `frontend`. Each restarts on failure, up to 5 times.
- **PostgreSQL and Redis** also run on Railway, although the repository's files do not define them.
- **Deployment:** Alembic migrations run before every deploy (`alembic upgrade head`). Health checks hit `/status` on the backend and `/` on the frontend. Images install locked dependencies (`uv sync --frozen`, `pnpm install --frozen-lockfile`).
- **A Railway lesson:** config in the repository overrides service settings. The worker count was first changed through the Railway API, with no effect, because the `.toml` file still set the start command. The change had to be made in the repository.
- **Cost:** under $2 a month. Railway bills reserved RAM per second, and outside December traffic is a handful of requests a day.
- **Manual operations:** the tools to move a deadline, reschedule the draw and re-send an email were added on 17 December 2025, during the season. As far as Dawid knows, every real case was handled properly.
- **Monitoring:** application logs (structlog) and Railway health checks only. No error tracking or metrics are configured in the repository.
- **Code quality:** no CI in the repository. Checks are local pre-commit hooks (ruff, ruff-format, codespell). The only test is a placeholder Vitest file. The backend has no tests.

## Results

- Tens of events have been created.
- Fewer than 100 distinct users have used the site.
- The service is live at https://picko.world and the code is public. The site itself shows no statistics.

## Limitations and what's next

- **No plans for further development.** Picko is a tool for fun and will stay as it is. The repository has no TODOs or roadmap.
- **Participants can see each other's email addresses.** The event page lists everyone's address, and every participant's card links to it. This is by design.
- **No exclusion rules.** The draw only guarantees that nobody gets themselves. You cannot, for example, stop partners from drawing each other.
- **Hard-coded limits:** three currencies (PLN, USD, EUR), two languages, and emails only in a Christmas template.
- **Little room for mistakes.** Registration closes for good at the deadline. People who left out their email depend on having bookmarked their card. A lost link cannot be recovered.
- **No organiser controls in the interface.** Moving the draw and re-sending an email are available only through the admin command line.
- **Notes from reading the code (not verified by running it):**
  - email links are built from the list of CORS origins, so with more than one origin they would be malformed,
  - the draw on read does not lock the row.
- **Tests:** almost no automated tests and no CI.
