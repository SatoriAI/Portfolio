from collections.abc import Iterator

import pytest
from django.test import override_settings


@pytest.fixture(autouse=True, scope="session")
def in_memory_caches() -> Iterator[None]:
    """The suite clears Vex's cache between tests, which on Redis is a FLUSHDB of the whole database, other apps' keys
    included. So it never runs against the Redis that REDIS_URL names, whatever .env says; the tests that exercise
    Redis point at a fake one of their own."""
    local = "django.core.cache.backends.locmem.LocMemCache"
    with override_settings(CACHES={"default": {"BACKEND": local}, "vex": {"BACKEND": local, "LOCATION": "vex"}}):
        yield


@pytest.fixture(autouse=True)
def closed_breaker() -> Iterator[None]:
    """A test that takes Redis down would otherwise leave the vex cache's breaker open for the tests after it."""
    from vex.utils.cache import breaker  # pylint: disable=import-outside-toplevel

    breaker.reset()
    yield
    breaker.reset()
