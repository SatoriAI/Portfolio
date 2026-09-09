FROM python:3.13-slim AS base

ARG APP_DIR=/source
WORKDIR ${APP_DIR}

ENV PATH=${APP_DIR}/.venv/bin:${PATH} \
	PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install gettext (for compiling messages to other languages) and uv (single static binary) and clean up
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates gettext \
    && curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests only, so the install layer is cached until they change
COPY pyproject.toml uv.lock ./

# Development image: dev dependencies included and no source baked in, because
# docker-compose bind-mounts the tree instead — edits reload without a rebuild.
FROM base AS dev
RUN uv sync --frozen

# Production image. This stage is last on purpose: Railway builds the Dockerfile
# without specifying a target, so the final stage is what ships.
FROM base AS production

# Install dependencies with UV and no changes to the .lock file
RUN uv sync --frozen --no-dev

# Copy source code for Portfolio
COPY portfolio/ ./portfolio/

# Probe /healtcheck every 30s, time out after 5s, start probing 20s after boot, retry 3x
HEALTHCHECK --interval=30s --timeout=30s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/healthcheck/ || exit 1
