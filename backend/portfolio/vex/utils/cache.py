"""Vex's shared state (its rate-limit counts, the day's spend, the persona) lives in the "vex" cache, which is Redis
in production (see settings.CACHES). Redis being down must not take Vex down with it, so every use of it fails open:
the limits let the request through, the spend is read from the database, the persona is read afresh.

A Redis that hangs rather than refuses costs a timeout per use, and a question uses the cache half a dozen times; with
every request paying that, the site's threads would all be waiting on Redis. So a circuit breaker sits in front of the
cache: the first failure opens it, and for OPEN_SECONDS every use fails at once without touching Redis. After that one
request tries Redis again (the others keep skipping it until that one has its answer) and closes the breaker if it
answers. Each window logs one error when it opens and one line when Redis is back, not one per use."""

import logging
import threading
import time
from collections.abc import Callable
from typing import Any

from django.core.cache import caches
from django.utils.connection import ConnectionProxy
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

OPEN_SECONDS = 30.0


class CacheUnavailable(Exception):
    """The vex cache could not be used: Redis failed just now, or failed recently and is being left alone."""


class Breaker:
    """Per process, shared by its threads."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._open_until: float | None = None  # None while closed
        self._probing = False

    def allow(self) -> bool:
        """Whether this use may try Redis. Once a window has passed, the first caller gets to probe."""
        if self._open_until is None:
            return True
        with self._lock:
            if self._open_until is None:
                return True
            if self._probing or time.monotonic() < self._open_until:
                return False
            self._probing = True
            return True

    def succeeded(self) -> None:
        if self._open_until is None:
            return
        with self._lock:
            if self._open_until is not None:
                self._open_until, self._probing = None, False
                logger.info("Vex's cache is reachable again; the limits, the spend counter and the persona use it")

    def failed(self, error: Exception) -> None:
        with self._lock:
            # Threads that were already waiting on Redis when it opened fail too; their window is the same one.
            opening = self._open_until is None or self._probing
            self._open_until, self._probing = time.monotonic() + OPEN_SECONDS, False
        if opening:
            # No traceback: it would be the same one every window.
            logger.error(
                "Vex's cache is unavailable (%s: %s); for the next %.0f s the limits are skipped and the spend and "
                "the persona are read from the database",
                type(error).__name__,
                error,
                OPEN_SECONDS,
            )

    def reset(self) -> None:
        with self._lock:
            self._open_until, self._probing = None, False


breaker = Breaker()


class GuardedCache:
    """The vex cache behind the breaker: every method raises CacheUnavailable instead of reaching a Redis that has
    failed, or the error of one that just did. Anything else a method raises (incr's ValueError for a missing key)
    means Redis answered."""

    def __init__(self, cache: Any) -> None:
        self._cache = cache

    def __getattr__(self, name: str) -> Any:
        method = getattr(self._cache, name)
        if not callable(method):
            return method

        def guarded(*args: Any, **kwargs: Any) -> Any:
            return call(method, *args, **kwargs)

        return guarded


def call(method: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    if not breaker.allow():
        raise CacheUnavailable("skipped while the breaker is open")
    try:
        result = method(*args, **kwargs)
    except RedisError as error:
        breaker.failed(error)
        raise CacheUnavailable(f"{type(error).__name__}: {error}") from error
    except Exception:
        breaker.succeeded()
        raise
    breaker.succeeded()
    return result


# Resolved on every use, as django.core.cache.cache is, so each thread gets its own connection and a test's
# override of CACHES takes effect.
cache: Any = GuardedCache(ConnectionProxy(caches, "vex"))
