---
title: Slip
slug: slip
period: 2026-07 – ongoing
status: pre-launch
role: solo: product, design, backend, frontend, deployment and operations
context: commercial
stack: Python, Django, PostgreSQL, React, TypeScript, Vite, Tailwind CSS, OpenAI, Resend, Docker, Caddy, Railway, Cloudflare
demo: https://slip.today
repository: private
summary: Slip was built to put paper receipts in order and make them easy to find later. Take a photo, and AI reads and saves the key details. You can search receipts with filters or in plain language. Spending statistics show where the money goes. Slip also lets you create shared spaces to share receipts with other people.
---

# Slip

## Period and status

- First commit: 29 July 2026. Latest: 1 October 2026.
- The production build landed on 31 August 2026 (PR #10). The Railway services were created the same day.
- The README calls Slip feature-complete and running in production at slip.today, on Railway behind Cloudflare. Accounts, spaces, adding and reading receipts, search, password reset and installing the app all work.
- Slip is currently being tested by family and friends. Opening it to everyone, together with releases on the App Store and Google Play, is planned in a couple of months, potentially early 2027.

## Role and context

- Git history shows only Dawid: commits under his name, pull requests merged from his own GitHub account (SatoriAI, which owns the repository), and automated Dependabot updates.
- The repository holds everything he owned: backend, frontend, typed API client, configuration for five Railway services, monitoring commands, and the recorded design and copy decisions.
- The role covered product and visual design too. The decision records name Dawid as the one who made those calls: he agreed the Free and Plus limits and pricing (Friends & Family is unlimited by his choice) and decided that thumbnails stay private. He also picked an hourglass over a motion alternative, the bare S mark over the tiled app icon, and the quieter treatment for errors.
- Commercial: Dawid is building Slip as his own product. The code has "Free" and "Friends & Family" plans with monthly limits, and a paid Plus tier is coming soon.

## Short summary

Slip is a mobile web app for keeping receipts. You photograph a receipt, and the app reads the shop, date, total and items and flags anything that needs checking. Receipts are filed in spaces you keep to yourself or share with others. You can search and filter them, or find them by asking a question in your own words. The home screen shows the month's spending by category.

## Problem

Dawid kept his receipts in the freezer. That was the real reason he built Slip.

The README describes Slip as a mobile-first receipt manager: photograph a receipt, let a vision model extract the details, and keep it in a space shared with other people. Shared spaces answer a second need the app is built around: spending is often shared, for example within a household.

## How it works for the user

1. **Sign up and sign in** with an email and a password.
2. **A space.** A new account has no space, so it starts on the Spaces screen. A space is where your receipts are filed. Keep it to yourself or invite others. Each space has a name and a mark that tells it apart at a glance. Invitations wait in a list; you open one to join. Everyone in a space adds their own receipts and sees what the others bought and what it cost. Members are shown as owner or member.
3. **Add a receipt.** Tap "+", choose the space, then take a photo or pick one from the library. The app suggests laying the receipt flat and filling the frame. There is no cropping: the app finds the receipt in the photo itself.
4. **Reading.** The app fills in the shop, date, total and items. Item names come in the language of the person who uploaded the receipt. A receipt is done, needs a check, is being read, or could not be read.
5. **Checking.** A receipt is flagged when fields are missing, no items were read, items have no price, items do not add up to the total, or some lines were not read. Each problem is listed, and tapping it takes you to the field to fix. You can edit the shop, date, time, total, currency, tax, discount, payment method, receipt number and items. If reading failed, you can ask for another read or take a new photo. The photo opens full screen and zooms.
6. **Browse and search.** Search is instant and also matches category names. Filters: date, category, amount, currency, status, shop, and who added the receipt. Sorting, and 15 categories such as Groceries, Restaurants and Fuel.
7. **Ask a question.** Type three words or more and the app offers to ask it as a question. The answer is groups of matching receipts, best matches first, each linking to the full list.
8. **Home summary** for one space: this month's total and receipt count, last month's total, the split by category, a six-month chart, and how many receipts need a check or could not be read. Totals in different currencies are never added together.
9. **Settings:** your plan and this month's receipt and question counts, language (Polish, English or follow the device), appearance including a dark option, change or reset password, download your data (a zip of every receipt you can see, with all photos), and delete your account.
10. **Install** to the home screen as a web app (PWA).

## Technical description

**Stack**

- Backend: Python 3.13, Django 5, Django REST Framework, drf-spectacular (OpenAPI), django-filter, uv; served by gunicorn.
- Database: PostgreSQL 17 (psycopg 3 with its connection pool). It is also the job queue and the throttle store; there is no Redis or Celery.
- Imaging: Pillow, pillow-heif (HEIC), OpenCV and NumPy for auto-crop.
- Model: OpenAI SDK, gpt-4.1-mini by default; pydantic validates responses.
- Files: django-storages against an S3-compatible Railway bucket.
- Frontend: React 19, strict TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router 7, openapi-fetch with a client generated from the backend's OpenAPI schema, vite-plugin-pwa. Tooling: oxlint, Vitest, browser tests on Playwright Chromium.
- Web server: Caddy 2. Mail: SMTP through Resend.

**Layout**

- Monorepo with `backend/` and `frontend/`.
- Domain apps: `accounts`, `spaces`, `receipts`, `mailer`, `ops`. All HTTP code lives in `api/`, so the contract can be reviewed in one place.
- `clients/` is the model-provider boundary. Two rules are load-bearing: domain apps never import DRF, and vendor types never leave `clients/`.

**Five services from one repository**

- **Slip-UI:** Caddy serves the built app and proxies `/api/*` to the API over Railway's private network. The browser stays on one origin, so the session cookie is first-party and CSRF stays simple. Railway's edge cannot route a path to another service, so Caddy does it.
- **Slip-API:** gunicorn, one process, four threads. Migrations run before deploy; `/healthz` is the health check.
- **Slip-Worker:** processes receipts. The only service with the OpenAI key.
- **Slip-Mail:** sends mail. The only service with SMTP credentials.
- **Slip-Scheduler:** an hourly run of health checks and housekeeping.

**How a receipt travels**

1. The upload is answered with 202 and the job is queued.
2. The worker claims it from the Postgres queue (`SELECT … FOR UPDATE SKIP LOCKED`).
3. It normalises the image: decode, EXIF, HEIC to JPEG, downscale to 2000 px. A 200 MP limit is checked from the header before decoding.
4. It auto-crops to a bounding box around the print (OpenCV).
5. It calls the model once, at temperature 0, with a versioned prompt.
6. It writes the receipt and its items in one transaction. Every figure from the provider is converted to Decimal and refused if not finite.

**Statuses and reconciliation**

- Five statuses: uploaded, processing, review_required, completed, failed.
- `review_required` follows from a non-empty, closed set of reasons, enforced by a database constraint. There is no model "confidence".
- Items reconcile against the total and discount. When they fall well short, a second reading runs; agreement between the two decides whether the items were invented.

**Other parts**

- Questions: queued; the worker turns a question into filters and hints. The model sees the question and a computed calendar, never a receipt.
- Mail: a Postgres outbox drained by its own worker. Nothing is sent while a request is being handled.
- Photos: a private bucket, served only through a view that checks membership. No image URL is ever generated.
- Auth: Django cookie sessions, sliding to 30 days. Throttle counters in Postgres, keyed on `X-Real-IP`; IPv6 clients are keyed on their /64.
- Access: every query is scoped to the user's spaces; an unauthorised read returns 404.
- Allowance: a monthly allowance per user, 20 readings and 5 questions on the free plan (UTC month).
- Costs: every model call writes a `ModelCall` row with counts only, never content.
- Frontend: every query is a `queryOptions` factory over the generated client. The service worker caches only the app shell, never `/api/`; offline use is a deliberate non-goal.
- Languages: English and Polish. Django follows `Accept-Language`; the frontend formats dates and amounts.

## Engineering decisions

- **Postgres as the queue, not Celery or Redis.** The database is already required, and SKIP LOCKED is about thirty lines. Mail uses it too. The same reasoning moved throttle counters into Postgres. The earlier LocMemCache lived per process: two workers doubled the 10-per-minute limit, and every restart reset the counts.
- **One model, chosen on silent errors.** The default moved from gpt-4o-mini to gpt-4.1-mini after 35 runs per model on one receipt with known values. On a blurred photo, gpt-4o-mini returned no items in 14 of 25 runs; gpt-4.1-mini read all ten lines in 35 of 35. It was also cheaper: $2.76 against $6.19 per thousand receipts, because gpt-4o-mini billed about 37k input tokens per image. The cheapest model tested was rejected for inventing an unreadable year in 24 of 35 runs. On 11 September 2026 Slip went OpenAI-only and the Anthropic and Gemini modules were removed: one vendor to measure, bill and support.
- **No confidence score from the model.** A model's self-report is not a measurement, so review flags come from arithmetic. Size thresholds alone were rejected: invented baskets and partial reads both sum below the total, so a threshold cannot tell them apart. Stability across a second reading does. A second reading on every receipt was rejected as too costly.
- **Prompt fixes as rules, not till wording.** A deposit-line fix quoted one till's text, so a test on that receipt could not fail; it was dropped. An arithmetic rule recovered the deposit in 30 of 30 runs, against 0 of 30 before. A targeted second pass was measured and rejected: more machinery, no gain.
- **Fields that measurement removed.** The tax-ID (NIP) field went: the model returned a value for 12 of 16 photos, none passed the mod-11 checksum, and 9 were not on the receipt at all. `receipt_number` stays undefined because defining it measured worse.
- **Provider failures defer instead of failing.** A revoked key, quota, rate limit or outage re-queues the job, with backoff capped at 30 minutes. Before, users were told the photo could not be read because of a billing problem they could do nothing about.
- **Server-side auto-crop, as a bounding box.** Four draggable corners were rejected: they handed the user a job that takes 13–32 ms. Detection in the browser would mean shipping OpenCV as wasm to a mobile app. A quad with perspective correction was pointless, since nothing reads an OCR pass and crumpled rolls fit quads badly. It detects print, not paper edges. Over-cropping is the only costly failure, so every guardrail falls back to the whole frame.
- **Sessions, IDs and 404s.** Sessions over JWT: one origin, revocable, no token readable by JavaScript. Integer keys over UUIDs, because scoping is the security control. 404 over 403, because existence itself is information.
- **Object storage for files.** Not a Postgres BinaryField, because bytea inflates backups and defeats streaming. An S3-compatible bucket is required because the API and the worker run in separate containers; local disk would silently lose photos.
- **Separate mail and receipt workers.** Two failure domains. The receipt worker will not start without a model provider, but mail must keep running so a locked-out user can reset their password.
- **Threads, not processes, in the API.** The API mostly waits on I/O: about 0.0008 vCPU against 145 MB resident over a week. A second process would roughly double a memory-billed service. On the receipts screen, a burst of requests dropped from 208 ms to 46 ms.
- **Railway settings as code.** `.railway/railway.ts` replaced dashboard settings. The earlier `.toml` files were never read: Railway's Config as Code opt-in closed on 28 August 2026, and Slip's services were created on the 31st. A pull request posts the plan as a comment and merging applies it. Destructive plans fail in CI and are applied by hand.
- **Security headers in Caddy, not Django.** One origin, one header block, covering the shell, assets, service worker and API. The Content Security Policy allows the single inline script by hash, not nonce, because Caddy serves a static file.

## Running it in production

**Hosting**

- Railway, one replica per service; a PostgreSQL database and Slip's own bucket for photos.
- Cloudflare sits in front: TLS at the edge and an http-to-https redirect. slip.today is attached to Slip-UI.

**Deployment**

- Railway deploys merged code from GitHub; the API runs migrations before deploy.
- Docker images pin base images by digest, so a redeploy cannot pull in an unreviewed base. Backend containers run as a non-root user.
- Workers get a drain window on deploy: 120 s for receipts, 60 s for mail. Model calls time out at 90 s.
- Each secret lives only on the service that reads it.

**CI**

- Backend: static checks first (ruff, mypy, migration guard, OpenAPI schema drift), then tests against Postgres 17.
- Frontend: lint, build, Vitest, Playwright browser tests, and a version-bump guard on pull requests.
- `make check` is the definition of done and runs as a pre-commit hook.
- CI is tuned for GitHub's per-minute billing: frontend jobs merged into one, 10-minute timeouts.

**Monitoring**

- Every hour the scheduler checks the receipt queue, the mail outbox, stored images and throttles.
- Each job pings a dead-man's-switch URL, so silence raises the alarm. With no URL set, the scheduler logs an error on every run and the cron run exits as failed.
- Why: a provider outage is deliberately invisible to users, so the queue check is the only alarm.
- In production the pings go to healthchecks.io, on its free tier.

**Costs**

- Hosting currently costs under a dollar a month.
- OpenAI: $2.76 per thousand receipts on gpt-4.1-mini (measured) and about $0.75 per thousand questions.
- `manage.py model_usage --month` reports usage by purpose and model. No price table is kept in code.

**Incidents and lessons**

- **Workers died on database errors.** Railway stops restarting a service after five exits. Since 14 September 2026 workers reconnect with backoff, and a job that keeps crashing its worker fails after a set number of attempts.
- **The API served one request at a time.** A single sync gunicorn worker queued a screen's three or four parallel calls. Fixed with four threads.
- **Stale connections after a Postgres restart.** The first request on each worker returned 500. psycopg's pool, which checks a connection before handing it out, fixed it.
- **A missing file served as the app.** A missing `/assets/` chunk returned the app's HTML with a year-long `immutable` header, cached by Cloudflare and the service worker. After a deploy or rollback the app could open blank. It now returns 404.
- **Cloudflare overrode cache headers.** Browser Cache TTL masked the origin's headers (`/sw.js` went out with max-age=14400). On 16 September 2026 it was set to respect the origin.
- **No security headers.** Until 15 September 2026 the app shell sent none. Caddy now sets HSTS, CSP and others.
- **Queue stalls went unnoticed.** Twice in one day in development: a worker running three-day-old code, and one that crashed on an import error. This led to the restarts and the queue alarm.
- **Long-running processes keep old configuration.** A worker held a stale `.env`. Lesson: check the running process, not the file.

## Results

- The README states Slip is feature-complete and running in production at slip.today.
- So far it has a couple of users and a couple of spaces: the family and friends testing it.
- Development: 450 commits between 29 July and 1 October 2026, with pull requests numbered up to #140.
- Reading-accuracy measurements exist in the repository (the model comparisons under Engineering decisions), but they are internal evaluations, not user outcomes.
- Around 100 receipts processed so far, and several weeks of uptime without issues.

## Limitations and what's next

- **Monthly limits.** The free plan allows 20 receipts and 5 questions a month; "Friends & Family" has no limits. Plans are assigned by hand from an email allowlist. There is no payment yet.
- **A paid Plus tier is the next step.** Plus is planned to offer unlimited receipts and 500 questions a month for 19.99 zł a month or 149 zł a year, billed through Stripe. Timing: as soon as possible, within weeks. The cost ledger for model calls was built to prepare the question feature for billing. A paid plan needs its own screen, and billing needs a rule for which plan wins when someone has two.
- **Opening to users.** In a couple of months, potentially early 2027, Slip is due to open to everyone and ship on the App Store and Google Play.
- **One model provider.** OpenAI only since 11 September 2026.
- **No tax ID.** Asking the model for the shop's NIP makes it invent one, so the field was removed.
- **Receipts wait when reading stops.** If the worker is down or the provider fails on Slip's side, a receipt waits in the queue instead of failing.
- **Basic monitoring.** Hourly checks and pings to healthchecks.io on its free tier.
- **No offline use.** A deliberate choice: the service worker caches only the app shell.
- There are no TODO or FIXME comments in the code and no roadmap file.
