---
title: Athlo
slug: athlo
period: 2026-09 – ongoing
status: pre-launch
role: Sole developer and owner (design, backend, frontend, infrastructure)
context: A personal project that may grow into a commercial experiment. Built at the request of someone from the boxing community.
stack: Python, Django, PostgreSQL, Celery, Redis, React, TypeScript, Vite, Tailwind CSS, Resend, Docker, Caddy, Railway
demo: https://athlo-ui-production.up.railway.app
repository: private GitHub repository
summary: Athlo started after a conversation with a boxer friend who told me how hard it is to organise competitions. The platform connects athletes, clubs and organisers. Organisers can publish events, manage entries and announce results. Athletes search for competitions by sport and date and enter the ones they choose, and their results build a record of starts on their profiles.
---

# Athlo

## Period and status

- First commit: 21 September 2026. Last commit on `main`: 24 September 2026. Those four days produced 75 commits.
- Status: pre-alpha, building milestone M0. It is not open to users, and all data is demo data.
- Deployed for internal testing on Railway, with no public address. The first deploy was on 22 September 2026.
- No launch date for users has been set.

## Role and context

- Git history shows Dawid as the only human author: 86 of 89 commits across all branches, including 5 pull requests merged from his personal GitHub account. The other 3 are Dependabot updates.
- Some commits were written with AI assistance (Claude).
- The requirements document names Dawid as the project owner.
- It is a personal project that may grow into a commercial experiment. Dawid built it at the request of someone from the boxing community. The requirements already set out a revenue model: club and federation subscriptions plus a flat per-entry fee.

## Short summary

Athlo connects athletes, clubs and organizers around sporting competitions, starting with boxing in Poland. Organizers publish events, review entries, export them as CSV and publish results. Athletes find events by sport and date, enter them, and their results build a career history on their profile. Pre-alpha: still under development, not yet available to users.

## Problem

Athlo is meant to cover a competition end to end: discovery, registration, entry fee, participation, results and coverage. Each group needs something different:

- **Athletes** have no single place to find competitions, enter them and keep one history of their results.
- **Organizers** want to publish an event quickly, including from an existing PDF of the rules, then manage entries and fees and publish results.
- **Clubs and federations** want to manage a roster and enter athletes in bulk.
- **The public** wants news about recent competitions.

Today organizers collect entry fees themselves. In Poland registration is priced per entry (ZapisyOnline charges 0.99 PLN per paid registration). Fees in the Polish Boxing Association appear to be seasonal and paid centrally, which the requirements document has not yet confirmed.

The project started because someone from the boxing community asked for it. What organizers and athletes use today is not known yet.

## How it works for the user

Nothing is public yet. This describes the M0 product as it exists in the repository.

**Athlete**

1. The home page reads: "Find a start, enter, follow the results."
2. Browses events by search, sport, presets and a date range on a calendar. Events open for entries are shown by default.
3. Creates an account (name, date of birth, main sport, category) and confirms their email.
4. Opens an event page: categories with fee and places left, requirements, refund policy, payment instructions and a contact.
5. Enters: picks a category, confirms they meet the requirements, and receives a confirmation email.
6. Sees upcoming and past entries with payment status under "My events", and can withdraw.
7. Their profile shows past results, podium finishes as medals, a chart of places and how many athletes they finished ahead of. They choose who can see their name, sport and results.

**Organizer**

1. Creates an event: dates, venue, registration window, capacity, fee and currency, payment instructions, refund policy, requirements, contact, and public or link-only visibility.
2. Moves it through its stages: registration open, completed, results published.
3. Reviews entries filtered by category and status, and exports them as CSV.
4. Publishes results.

**Everyone**

- A shareable event page with the start list and results.
- A news section, currently holding placeholder articles. AI-written articles are planned for M6.

The interface is Polish first, with English available.

## Technical description

**Services (three on Railway)**

- **Athlo-UI**: a Caddy container. It serves the Vite-built SPA and is the only public entry point. It forwards API requests over Railway's private network.
- **Athlo-API**: Django and DRF under Gunicorn (1 worker, 4 threads). Migrations run before each deploy, and `/healthz` serves the health check. It deliberately has no public domain.
- **Athlo-Worker**: a Celery worker built from the same Django image.
- Athlo has its own PostgreSQL role and database, without superuser rights.

**How a request travels**

1. The browser always talks to one origin.
2. Railway's edge terminates TLS and hands the request to Caddy.
3. Caddy serves a fingerprinted static file (cached for a year) or proxies `/api/*` to Django.
4. With one origin, the session cookie stays first-party and CSRF stays simple.

**Code**

- `backend/apps/` has one package per domain: accounts, athletes, audit, competitions, disciplines, entries, events, organizers, mail, public metadata.
- `backend/api/` is the DRF layer and holds no domain logic.
- The frontend's typed client is generated from the OpenAPI schema committed to the repository.

**Data model**

- Sports are data, not code. Each has versioned schemas: category dimensions, profile fields, result fields and an age rule. An event pins a schema version, and a result records the version it was written under. Boxing came first; running, cycling, swimming, MMA and triathlon were added later.
- Result types are a closed set in code: ranked, head-to-head, scored, team fixture.
- Values every sport needs (place, ranking score, result date) are ordinary columns next to the JSON data.
- Results are append-only. A correction supersedes the earlier row, and a published row cannot be changed.
- An entry belongs to a category, not the whole event. Capacity is checked under a row lock.
- Event search uses PostgreSQL full-text search, with a target of 500 ms at the 95th percentile.

**Mail**

- A message is written to an outbox table first, in the same transaction as whatever caused it.
- A Celery task is dispatched once that transaction commits.
- Delivery is at-least-once: rows are claimed with `SELECT … FOR UPDATE SKIP LOCKED`, and a dedupe key prevents duplicates. Retries come after 1, 5, 15 and 60 minutes.
- Locally mail goes to Mailpit; in production it goes through Resend over SMTP.

**Link previews**

- For `/events/<slug>` and `/athletes/<slug>`, Django returns a "metadata shell": the real title, Open Graph and Twitter tags, JSON-LD, and `noindex` for link-only events.
- The shell loads the same JS and CSS bundles as the SPA. Django knows their names from a committed copy of Vite's build manifest.
- A browser boots the app from it, while a crawler reads only the tags. Both get identical HTML, with no user-agent branching.

**Other details**

- Passwords are hashed with Argon2.
- A strict CSP (the inline pre-paint script is allowed by hash), HSTS, COOP and X-Frame-Options DENY.
- Logs go to the console through a filter that strips token paths.
- Polish is the primary language. English defines the set of translation keys and Polish is typed against it, so a missing translation fails the build.

## Engineering decisions

1. **Django, DRF and Celery over FastAPI.** Django provides the admin (most of the admin requirements), authentication and a job runner. With FastAPI all three would have been built by hand. The jsonb sport schemas already implied PostgreSQL. It also follows the patterns used in Slip.
2. **React and Vite over SvelteKit**, although the requirements and design system assumed SvelteKit. Slip's setup had already solved the PWA, the dark-mode flash, typed translations, the CSP and the single origin. Paraglide's compile-time message catalogue would clash with admins entering sport labels at runtime. A lesson recorded along the way: a first analysis compared only the `package.json` files and wrongly concluded that Slip had no i18n.
3. **A Django metadata shell over Next.js, Vike or a prerendering service.** The need was crawler-readable metadata, not server-side rendering. Next.js meant giving up the router, i18n, PWA and theming. Vike would add a Node process and require SSR-safe components. A headless-browser prerenderer adds a moving part, a vendor and crawl latency. Bundle names come from Vite's manifest rather than from parsing the built HTML.
4. **One shared model with versioned schemas over a table per sport.** Per-sport tables give real types, but every new sport would need a migration, an API, an export and a leaderboard. Cross-sport features (an athlete's history, search, rankings) would become unions that grow with each sport. A test makes sure the string `boxing` appears only in the sport registry.
5. **A published result keeps its own copy of the athlete's name.** This reconciles GDPR erasure with permanent results: on erasure the account is pseudonymised, while results keep their copied name and club. A correction carries the copy forward instead of reading the profile again.
6. **Age is calculated against the competition date, not today.** Otherwise athletes would change category mid-season. The check for minors uses calendar age, separately.
7. **Roles are memberships scoped to an organizer**, not an account-type column.
8. **Entry status and payment status are separate columns** from the first migration, though there are no payments yet.
9. **Caddy as the only way in, with no public API address.** With two public paths of different proxy depth, no `NUM_PROXIES` value was right. At 1, all users shared one rate-limit bucket. At 2, anyone calling the API directly could forge `X-Forwarded-For`. The second path was removed, and `collectstatic` moved into the Dockerfile so the admin keeps its styles.
10. **Mail sent on commit; `celery beat` retired.** Beat polled the outbox every 30 seconds, though no email depends on time passing. That added up to 30 seconds to verification emails. After the change, 0.44 s from request to arrival was measured. Order mattered: the beat service could be removed only once the new dispatch was deployed.
11. **Celery fails fast when Redis is down.** With Redis down, a registration took 19 s because of result-backend retries and kombu back-off. Ignoring results and bounding connection retries brought it to 0.23 s.
12. **The mail backend depends on whether an SMTP host is configured, not on `DEBUG`.** Keyed on `DEBUG`, a test deploy without credentials would silently drop every verification email.
13. **Argon2 from the start.** Switching after real accounts exist would mean rehashing on sign-in and running two hashers in the meantime.
14. **Railway configuration as code (`railway.ts`) instead of the deprecated `railway.json`**, which stops being read on 1 December 2026. The plan is posted on the pull request, and the apply runs exactly that plan.
15. **Offset local ports** (app 5183, API 8802, database 5435) so Athlo runs alongside Slip and Picko.

## Running it in production

There is only an internal test environment so far, with no public address.

- **Hosting:** Railway. Services: Athlo-UI, Athlo-API, Athlo-Worker, plus PostgreSQL and Redis.
- **Deploys:** a push to `main` builds both services from Dockerfiles. Migrations run before the deploy, and the worker gets 120 s to finish its tasks. Images are pinned by digest and run as a non-root user. Railway configuration changes go through a pull request: the plan is posted as a comment and applied on merge. A plan that deletes anything is refused and applied by hand.
- **CI:** GitHub Actions calls the same Makefile targets as the local gate, `make check`, which also runs as a pre-commit hook.
  - Backend: lint, types, migration and API-schema drift checks, tests against PostgreSQL 17.
  - Frontend: lint, types, Vitest browser tests, the production build, and a check that the metadata shell points at the current build.
  - Dependabot opens dependency updates.
- **Tests:** 76 backend and 27 frontend test files.
- **Monitoring:** console logs, Railway health checks (`/healthz` for the API, `/` for the UI) and a `mail_outbox_status` command for stuck mail. Nothing beyond that yet: no Sentry, no other APM and no external uptime monitoring.
- **Costs:** close to nothing.

**What the test environment taught**

- On its first real deploy, `celery beat` crash-looped: running as non-root, it could not write its schedule file.
- The frontend gate failed on its first CI run because `npm ci` does not install Playwright's browser.
- The proxy-depth and rate-limit problem (decision 9).
- Several changes were checked against built containers rather than the dev server, because the gate could not have caught those issues.

## Results

Nothing is measurable on the user side yet: it is not deployed for users, and the data is demo data (loaded with `make seed`).

Engineering numbers from the commit that completed the M0 path: 182 backend tests, 28 frontend tests, and a clean type check across 145 files. Measured during the mail change: 0.44 s from request to email arrival.

Success metrics (published events, entry conversion, retention and others) are defined, but are to be tracked from launch. Outside the project, one person from the boxing community has seen and tried Athlo so far.

## Limitations and what's next

**Left out of M0 on purpose:** payments, photo uploads, clubs, draws, seeding and scheduling. Entries have only basic states, with no waitlist, approval or check-in.

**Milestones**

- M1: a clickable skeleton and one real event, free or paid at the door.
- M2: running competitions (draw, weigh-in, results).
- M3: clubs.
- M4: entry payments.
- M5: billing.
- M6: AI import of events from a PDF, and AI-written news.
- M7: growth and hardening, including a second sport.

Boxing comes first. Running, cycling, swimming, MMA and triathlon are already in the registry, and the interface labels them "Soon".

**Open decisions that block later work**

- How the Polish Boxing Association's entry fee actually flows (blocks billing).
- Who is the merchant of record (blocks payments).
- What uniquely identifies an athlete (blocks club invitations).
- Minors and guardianship for paid entries.
- Keeping published results after an account is deleted.

**Risk named in the requirements:** three milestones ship before any money moves, so the commercial assumptions have to be tested in conversation during M1 and M2, including with a regional boxing association. That conversation has not happened yet, but it is planned.

**Documentation to fix:** the README and the agent instructions describe a `backend/clients/` directory that does not exist in the repository. Mail goes directly through Django's SMTP backend.
