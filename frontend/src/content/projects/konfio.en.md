---
title: Konfio
slug: konfio
period: 2025-07 – ongoing
status: live
role: co-founder: backend, frontend, deployment; the other co-founder handles sales and partnerships
context: commercial
stack: Python, Django, PostgreSQL, Celery, Redis, React, TypeScript, Vite, Tailwind CSS, OpenAI, Resend, Google Cloud Storage, Google Maps Platform, Docker, Railway, Cloudflare
demo: https://konfio.pl
repository: private
summary: Konfio connects event organisers with hotels in Poland. Describe the event once and send a single request to receive offers in one common format. The organiser can compare them with the help of AI and negotiate prices. The platform is free to use, and hotels pay a commission only on events that took place. More than 50 organisations already use Konfio.
---

# Konfio

## Period and status

- Work started on 29 July 2025. The first deployment work dates from August 2025.
- Activity peaked in August 2025 and from January to August 2026. Almost nothing was committed between September and December 2025.
- The frontend began in a separate repository and moved into the monorepo on 11 July 2026.
- The latest commit is from 13 August 2026.
- Konfio runs in production at konfio.pl (site) and app.konfio.pl (app). The site carries a BETA label.
- Konfio opened to real organisers and hotels around April 2026.
- konfio.com is not the project's domain. It redirects to an unrelated company.

## Role and context

- Konfio is a venture with two co-founders. Legally, it runs under Dawid's sole proprietorship.
- Dawid looks after technology and technical support. The other co-founder handles sales and partnerships.
- Dawid wrote all the code: the backend (Django), both frontends (React) and the deployment (Railway config and deploy scripts). The code history shows no other human authors.
- Besides Dawid's own commits, the history holds pull-request merges and badge auto-commits from his second GitHub account (SatoriAI), commits from the bot of Lovable, the AI app builder that scaffolded the first version of the frontend, and 9 commits authored as Claude.
- Konfio charges money: hotels pay a commission on events that take place.

## Short summary

Konfio connects event organisers with hotels in Poland. Organisers describe an event once and send one request. Hotels reply with itemised offers in a shared format. Organisers compare them side by side, with AI suggestions, and can negotiate the price of single items. The platform is free; hotels pay a commission only on events that take place. Konfio is in beta.

## Problem

- **Organisers** sourced hotels through emails, PDFs and spreadsheets. One event meant dozens of messages.
- **Hotel offers** arrived in different formats and could not be compared directly.
- **Hotels** received random inquiries and had to work out what the organiser expected.
- The market is Poland: a request covers one city or the whole country, and prices are in PLN.
- The idea came from the co-founder, who has worked in the hotel industry all his life.

## How it works for the user

**Organiser**

1. **Signs up** at app.konfio.pl and confirms their email with a code. They can invite colleagues.
2. **Describes the event once.** One form covers dates, guest count, rooms, catering, drinks and budget. Event types range from conferences and trainings to galas and Christmas parties. The site says this takes about 5 minutes.
3. **Chooses who receives it.** There are three options:
   - Konfio matches hotels automatically.
   - The organiser picks specific hotels, including ones not on the platform. Those get a secure link by email.
   - The organiser sends an email Konfio has drafted from their own inbox, and hotels reply through a shared link.
4. **Receives offers** itemised cost by cost, in one format, with notifications.
5. **Compares offers side by side.** The organiser can ask the AI to score each offer from 1 to 10 on price, standard, requirement coverage, added value and the quality of notes. The AI suggests the best fit. The organiser can add their own instructions. The final choice is theirs.
6. **Negotiates and decides.** The organiser can negotiate the price of a single line item, message hotels and keep an address book of hotels. They accept one offer, and the others are marked as not selected.
7. **Confirms the event took place.** Both sides are asked the day after it ends. The commission is based on confirmed events.

**Hotel**

1. **Joins and fills in a profile:** general information, contact details, rooms and conference rooms. Konfio matches requests against it.
2. **Receives matching requests** by location, standard and capacity. An email arrives when a request is published. If the hotel has not answered, a reminder comes 12 hours before the request expires.
3. **Reads the brief, then answers or declines.** A decline gives a reason: dates unavailable, no capacity, budget too low, or the event type does not fit.
4. **Builds the offer.** The form is pre-filled from the request, and the hotel adds its prices. A hotel without an account can respond through a link.
5. **Tracks the offer.** It sees when the organiser opened it and when it was chosen, and takes part in any price negotiation.

**Cost and language**

- The platform is free for both sides. Hotels pay 8% only on events that take place.
- The interface is in Polish and English. Emails go out in the recipient's language.

## Technical description

**Shape.** A monorepo with a Django API and two React apps:

- `apps/marketing` is the public site,
- `apps/app` is the signed-in app, with separate route trees for hotels and organisers,
- `packages/shared` holds shared components and translations (EN/PL). Translations run through a custom `useLocale` hook inherited from the Lovable scaffold.

**Backend modules**

- `partner`: users, hotels and organisers, profiles, rooms and conference rooms, memberships, onboarding, account deletion.
- `rfp`: the request lifecycle (draft → published → archived), invitations, offers with line items, per-line-item price negotiation, event confirmations, notifications, an email log.
- `ai`: OpenAI-backed features with cost tracking: offer scoring, organiser insights, dashboard greetings, email drafts.
- `addressbook`: invitations to hotels that are not yet registered.

**Matching hotels.** Location and standard are hard filters. Location is one city, optionally with a radius in kilometres (haversine formula), or all of Poland. Standard is 2–5 stars or uncategorised. Capacity deliberately does not filter; it feeds the score. Public links for off-platform hotels are throttled to 30 requests per hour.

**Negotiation** works per line item, turn by turn, with at most 20 messages.

**How a request travels**

1. The browser app calls the API (Django REST Framework) with a JWT. Access tokens last 60 minutes, refresh tokens 14 days.
2. gunicorn handles it with one Uvicorn worker (ASGI).
3. Side effects such as email go to Celery through Redis. Email has its own queue.
4. The worker sends email through Resend's HTTP API.

**Live notifications.** A notification is saved to the database and published on Redis pub/sub. The browser receives it over Server-Sent Events. EventSource cannot send auth headers, so the client first gets a one-time ticket: a UUID kept in Redis for 30 seconds and deleted on first use.

**Scheduled jobs** (Celery Beat, schedule stored in the database):

- every 15 minutes: request reminders, scheduled account deletions, purges of expired pending registrations and email changes,
- daily: archiving expired requests, event confirmations, snapshots of match counts,
- weekly: onboarding reminders (Monday 08:05, Warsaw time).

**AI.** Each feature is a "mission": a system message, a user message and a JSON schema. The model's output must follow the schema strictly. Every call is saved with its prompt, response, token counts and cost in USD. Offer scoring is limited by default to 5 runs per request per day, and an analysis is marked stale when new offers arrive. Models: gpt-5.4-mini (default) and gpt-5.4-nano.

**Files and admin.** Media and attachments live in two Google Cloud Storage buckets, with a prefix per environment. Uploads are capped at 15 MB. The admin (django-unfold) has its own metrics dashboards.

**Stack**

- Backend: Python 3.13, Django 5.2, Django REST Framework, PostgreSQL, Celery, Redis, simplejwt, drf-spectacular, uv.
- Frontend: React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form with Zod, Tailwind CSS, shadcn/ui, Google Maps, react-joyride (in-app tutorial).
- Services: OpenAI, Resend, Google Cloud Storage, a Google API for addresses.
- Tooling: GitHub Actions, Codecov, pre-commit (Ruff, MyPy, codespell), Vitest, Testing Library.

## Engineering decisions

1. **Celery worker on threads, not processes.** Railway reports 32 CPUs, so the default prefork pool started 32 Django processes and sat at about 3 GB idle. Eight threads fit in about 150 MB. This works because every task waits on the network (Resend, OpenAI, Postgres). The config records when to revisit it: a CPU-bound task goes to its own service with prefork and two processes.
2. **One gunicorn worker, recycled after about 1,000 requests.** The worker count is explicit to avoid the same 32-CPU trap. Production memory grew from 0.19 GB to 0.77 GB in six weeks, and Railway bills memory by the GB-minute. Recycling bounds the symptom. The config says plainly that it does not explain the cause.
3. **The deploy healthcheck covers only the web service.** It used to include Redis and the Celery workers. During a Redis outage Railway killed healthy web containers, and the Redis outage became a full API outage. The deploy gate now checks the database and migrations. The full check stays for monitoring. Tests pin the set of checks, because a name that matches no plugin is skipped silently.
4. **Rate limits counted in process memory, not Redis.** A Redis outage returned 500 errors on registration, password reset and public links. Rejected: a cache that lets traffic through on failure, since it would quietly switch off limits exactly where they are needed. The cost: with N workers, the limit grows N times.
5. **Redis connections have timeouts.** By default the client waits forever, and a hung Redis would stall the only worker and the whole API. The timeout is 2 s, above the 1 s kombu waits on its queue. Publishing retries only once.
6. **Pending registrations and email changes live in Postgres.** While they were in Redis, a Redis outage stopped anyone registering. The password is hashed on arrival, and the verification code is stored as a hash.
7. **Email through Resend's HTTP API, not SMTP.** Railway blocks outbound SMTP on port 587, and every email task timed out.
8. **Build work moved out of container start.** `collectstatic` and `compilemessages` run during the image build, with dummy secrets for that step only. Rejected: `preDeployCommand`, which runs in a separate container, so its files would never reach the app. Scheduler setup moved to the Beat service, so a Postgres outage no longer blocks the API from starting.
9. **Deliberately no Dockerfile HEALTHCHECK.** The old one called curl, which the image no longer had, so it could never pass. Pointing it at the full check would mark a healthy container unhealthy whenever a worker was down.
10. **Celery worker inspection removed.** tracemalloc showed that each `control.inspect()` call kept reply-queue bindings in memory for good. An explicit connection was measured and leaked the same way. After the removal, 600 healthcheck requests take 8 s instead of 79 s.
11. **The healthcheck stays threaded.** Running it on the request thread was tried and reverted: it closed the database connection mid-request and failed 4 tests.
12. **AI output always in a strict JSON schema, every call costed.** A daily limit per request caps spending.
13. **A single pre-deploy command.** Adding a second one coincided with web deploys failing in both environments with no log lines at all. It was reverted, and the data backfill became a manual runbook step.

## Running it in production

**Hosting**

- Railway, five services built from Dockerfiles: the HTTP server, the Celery worker, Celery Beat and the two frontend apps served as static files.
- Cloudflare sits in front. Files are stored in Google Cloud Storage.
- There is a second Railway environment besides production.

**Deployment and CI**

- Migrations run before each deploy. Production deploys are triggered by scripts through Railway's API.
- GitHub Actions runs separate backend and frontend jobs plus a repo-wide pre-commit check.
- Backend: MyPy, tests on Postgres 17 with at least 85% coverage required, and a migration check on a fresh database.
- Frontend: eslint, vitest and a build check.
- Commits follow Conventional Commits, enforced by a hook.

**Monitoring**

- Two health endpoints: `/healthcheck/web/` as the deploy gate and `/healthcheck/` for monitoring everything.
- Every email is logged, and every OpenAI call is saved with its cost.
- There is no external uptime or error monitoring yet. A tutorial rollback runbook mentions Sentry, but it is not wired up.

**Incidents and lessons**

- A Redis outage took down the whole API through the healthcheck. Decisions 3–5 came from it.
- Email failed entirely because Railway blocks SMTP. Hence the move to Resend.
- Memory grew steadily, and memory is billed. Worker recycling and removing the leaking check helped. About 600 MB of the growth is still unexplained.
- Registration depended on Redis until pending data moved to Postgres.

**Traffic and costs.** A configuration comment puts the API at about 10k requests a month. Railway, OpenAI, Resend and Google Cloud together cost around $10 a month.

## Results

- 49 active hotels and 8 organisers use Konfio.
- Each organiser sends 4.5 requests on average.
- Hotels respond to a request in under 10 minutes on average.
- The API handles about 10k requests a month.
- The figures on the site ("~5 min", "1 format", "0 PLN") describe the product, not its use.
- Konfio has been running for several months and roughly 40 offers have gone through it. There is no commission revenue yet. The number of confirmed events is not published.

## Limitations and what's next

- The site still carries a BETA label.
- Hotel supply is an open question. One metric decides when to switch off the nudge towards organiser-sent requests: once automatic matching finds enough hotels. The other flags organiser-sent adoption below 60% for review. Reviews are planned at 30 and 60 days after launch.
- In August 2026 production stability was still being worked on: start-up and healthcheck fixes, and notes in background jobs to remove once deploys settle.
- The admin still lacks a bulk email resend and re-running AI analyses. These are recorded as later work.
- A code clean-up is also pending: sending emails to each recipient is to move into one shared helper.
- Coverage is limited to Poland.
- The frontend README still names konfio.com, which belongs to an unrelated company.
- The next step is growing hotel supply.
