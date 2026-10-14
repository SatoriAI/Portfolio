# Portfolio — Backend

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2.5%2B-009688.svg)](https://www.djangoproject.com)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![Build Status](https://github.com/SatoriAI/Portfolio/actions/workflows/backend-quality.yml/badge.svg)](https://github.com/SatoriAI/Portfolio/actions/workflows/backend-quality.yml)
[![Coverage Status](https://codecov.io/gh/SatoriAI/Portfolio/branch/main/graph/badge.svg)](https://codecov.io/gh/SatoriAI/Portfolio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Backend written in Python (Django + PostgreSQL) for my personal portfolio with AI functionalities.

For the combined quick start, see the [repository README](../README.md).

## Layout

Three domain apps plus shared helpers, all under `portfolio/`:

| App | Holds |
| --- | --- |
| `work/` | Skills, projects, professional experience |
| `university/` | Schools, publications, testimonials |
| `vex/` | The assistant: conversations, documents, persona configuration |
| `utils/` | Shared model mixins and DRF helpers |

Every user-facing model is translatable (English and Polish) through `django-parler`, so localisation lives in the database rather than in the frontend.

### Vex

Everything Vex knows fits in its prompt, so nothing is retrieved. [`vex/ai/knowledge.py`](portfolio/vex/ai/knowledge.py) assembles one text per language from the documents uploaded in the admin (their extracted text, editable there), the site's Markdown (project write-ups and workshop pieces, which the frontend's build publishes as `/vex-kb/<pl|en>.json` and the backend fetches from `VEX_SITE_CONTENT_URL`), and the portfolio tables. [`vex/ai/prompt.py`](portfolio/vex/ai/prompt.py) puts the rules (versioned in code), the persona edited in the admin and that text into one system message, identical from question to question so OpenAI's prompt cache serves it, and [`vex/ai/provider.py`](portfolio/vex/ai/provider.py) streams the answer from OpenAI, which `/api/vex/chat/stream/` relays over SSE.

`python portfolio/manage.py vex_kb --locale pl` shows what Vex knows (sources and their size); `--dump` prints the whole system prompt. The model and its reasoning effort come from `VEX_MODEL` and `VEX_REASONING_EFFORT`.

Every call to the model is recorded in `Usage` with its tokens and cost, whether or not it ended in an answer. Once a UTC day's calls have cost `VEX_DAILY_BUDGET_USD` (5.00 by default), Vex stops calling the model and answers every question with a `resting` error event, which the site shows as a polite notice with Dawid's email, until midnight UTC ([`vex/ai/spend.py`](portfolio/vex/ai/spend.py)). The day's total is kept as a counter beside the rate limits and reseeded from `Usage` every few minutes, so questions asked at the same moment can take a day a few calls over the budget. `python portfolio/manage.py vex_spend [--date YYYY-MM-DD]` prints a day's spend, calls and cached share; the Usage list in the admin is headed by today's.

The rate limits, that counter and the persona live in the `vex` cache: Redis when `REDIS_URL` is set (keys prefixed `portfolio:`, as the Redis may be shared; nothing ever flushes it), otherwise each process's memory, where every gunicorn worker counts on its own and a deploy resets the counts. If Redis is unreachable Vex fails open: the limits let requests through, the spend is read from `Usage` instead, and each failure is logged as an error. The `default` cache stays in memory, so django-parler's translations never depend on Redis.

`vex/tests/evals/` holds a golden set of questions in both languages, run against the real model with `uv run pytest -m eval --no-cov portfolio/vex/tests/evals` (it needs the real content in `DATABASE_URL`, a reachable `VEX_SITE_CONTENT_URL` and a key with credit). It is never part of the default run or CI.

`tools/chat-tester/` is a static page for poking that stream by hand; open it in a browser, no build step.

## Commands

Run these from the repository root, where the [`Makefile`](../Makefile) holds the single
definition of each one — CI calls the same targets, so the two cannot drift.

- Install: `make install-backend`
- Tests, with the 85% coverage gate: `make test-backend`
- Lint and types: `make lint-backend`, `make typecheck`
- Compile the Polish catalogue after editing `.po` files: `make translations`

Serving is the one thing without a target, because it is interactive:

```bash
cd backend && uv run python portfolio/manage.py runserver
```

## Configuration

Copy `.env.example` to `.env` and fill it in. `SECRET_KEY`, `DATABASE_URL` and `OPENAI_API_KEY` have no defaults and Django will not start without them — including `OPENAI_API_KEY`, which only Vex actually uses.

## Limitations

- Without `VEX_SITE_CONTENT_URL` (or with the site unreachable) Vex still answers, from the database and the documents alone; `manage.py vex_kb` says which.
- Vex needs a key with credit on it. Without one the stream opens and then returns an error event: `401` for a bad key, `429 insufficient_quota` for an empty balance. Nothing else on the site depends on it.
- Without `REDIS_URL` the rate limits are per process, so with several workers a visitor gets several times the stated rate.
- A fresh database is empty. There is no seed fixture, so content is added through the admin.
- With `USE_S3` on, every `BUCKET_*` variable becomes required; media has no local fallback in that mode.
