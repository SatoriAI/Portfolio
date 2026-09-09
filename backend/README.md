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
| `vex/` | The RAG assistant: conversations, documents, prompt configuration |
| `utils/` | Shared model mixins and DRF helpers |

Every user-facing model is translatable (English and Polish) through `django-parler`, so localisation lives in the database rather than in the frontend.

### Vex

Documents uploaded in the admin are chunked and embedded into a pgvector collection by the `inject_documents` admin action. At query time [`vex/ai/rag.py`](portfolio/vex/ai/rag.py) merges locale-filtered vector hits with structured context read straight from the portfolio tables, feeds both into a prompt whose model, temperature and wording are editable in the admin, and streams the answer over SSE from `/api/vex/chat/stream/`.

`tools/chat-tester/` is a static page for poking that stream by hand; open it in a browser, no build step.

## Commands

```bash
uv sync --group dev                              # install
uv run python portfolio/manage.py runserver      # serve
uv run pytest                                    # tests, with an 85% coverage gate
uv run mypy .                                    # types
uv run pylint portfolio/portfolio portfolio/university portfolio/utils portfolio/work
```

## Configuration

Copy `.env.example` to `.env` and fill it in. `SECRET_KEY`, `DATABASE_URL`, `VECTOR_DB_COLLECTION` and `OPENAI_API_KEY` have no defaults and Django will not start without them.

The database must have the `vector` extension available — `docker compose up` from the repository root provides one; a stock Postgres will not do.
