from collections.abc import Iterator

import pytest
from _pytest.config.argparsing import Parser
from django.core.cache import caches
from django.test import override_settings

from vex.tests.evals import options


@pytest.fixture(autouse=True, scope="session")
def in_memory_caches() -> Iterator[None]:
    """The suite clears Vex's cache between tests, which on Redis is a FLUSHDB of the whole database, other apps' keys
    included. So it never runs against the Redis that REDIS_URL names, whatever .env says; the tests that exercise
    Redis point at a fake one of their own."""
    local = "django.core.cache.backends.locmem.LocMemCache"
    with override_settings(CACHES={"default": {"BACKEND": local}, "vex": {"BACKEND": local, "LOCATION": "vex"}}):
        yield


@pytest.fixture(autouse=True)
def empty_default_cache() -> Iterator[None]:
    """Parler keeps translations in the default cache by row id, and a test's rows are rolled back while the cache
    keeps them. import_work resets the id sequences, so a later test's row can take a rolled-back row's id and be
    given its cached translations, which a save then writes nowhere."""
    caches["default"].clear()
    yield


@pytest.fixture(autouse=True)
def closed_breaker() -> Iterator[None]:
    """A test that takes Redis down would otherwise leave the vex cache's breaker open for the tests after it."""
    from vex.utils.cache import breaker  # pylint: disable=import-outside-toplevel

    breaker.reset()
    yield
    breaker.reset()


# The evals' options (vex/tests/evals/conftest.py). Here because pytest reads options only from the conftest files it
# loads before collecting, and the evals' own is loaded during collection.
def pytest_addoption(parser: Parser) -> None:
    group = parser.getgroup("vex evals")
    group.addoption(
        "--eval-repeats",
        type=options.repeats,
        default=1,
        help="Answers per case; a case passes when at least two thirds of them pass.",
    )
    group.addoption(
        "--eval-threshold",
        type=options.share,
        default=0.9,
        help="The share of cases that must pass for the run to pass.",
    )
    group.addoption("--eval-json", help="Where to write every answer and verdict, as JSON.")
    group.addoption("--eval-markdown", help="Where to append the results as a Markdown table.")
