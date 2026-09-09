# One definition of every command this repository runs.
#
# CI invokes these targets rather than restating their commands. A transcription
# of a command into YAML is a second definition, and a second definition is one
# edit away from drifting: the pylint invocation names its apps explicitly, and
# adding a new one meant remembering to edit the workflow. It did not get
# remembered — the vex app was missing from that list for its whole life.
#
# Each half keeps its own tooling. These targets only say where to stand and what
# to call, so `make test` and the CI step are the same thing by construction.

.DEFAULT_GOAL := help
.PHONY: help install install-backend install-frontend \
        lint lint-backend lint-frontend format-frontend typecheck \
        test test-backend test-frontend build translations check

help:  ## Show this help
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Install ──────────────────────────────────────────────────────────────
install: install-backend install-frontend  ## Install both halves

install-backend:  ## Sync the backend venv from the lockfile
	cd backend && uv sync --locked --group dev

install-frontend:  ## Clean-install the frontend from the lockfile
	cd frontend && npm ci

# ── Backend ──────────────────────────────────────────────────────────────
lint-backend:  ## Pylint the backend apps
	cd backend && uv run pylint portfolio/portfolio portfolio/university portfolio/utils portfolio/vex portfolio/work

typecheck:  ## MyPy the backend
	cd backend && uv run mypy .

translations:  ## Compile the Polish catalogue (.po -> .mo); needs gettext
	cd backend/portfolio && uv run django-admin compilemessages -l pl

test-backend:  ## Run the backend suite with its coverage gate
	# The XML reports are what Codecov consumes. They live here rather than in
	# the workflow so that `make test-backend` and the CI step stay one thing;
	# both files are gitignored.
	cd backend && uv run pytest --cov-report xml --junitxml=report.xml

# ── Frontend ─────────────────────────────────────────────────────────────
lint-frontend:  ## ESLint the frontend
	cd frontend && npm run lint

format-frontend:  ## Check frontend formatting
	cd frontend && npm run format:check

test-frontend:  ## Run the frontend suite
	cd frontend && npm test

build:  ## Build the frontend, which is also what typechecks it
	cd frontend && npm run build

# ── Aggregates ───────────────────────────────────────────────────────────
lint: lint-backend lint-frontend  ## Lint both halves

test: test-backend test-frontend  ## Test both halves

check: lint typecheck format-frontend test build  ## Everything CI runs, minus the hooks
