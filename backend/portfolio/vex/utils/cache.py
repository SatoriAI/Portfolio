"""Vex's shared state (its rate-limit counts, the day's spend, the persona) lives in the "vex" cache, which is Redis
in production (see settings.CACHES). Redis being down must not take Vex down with it, so every use of it fails open:
the limits let the request through, the spend is read from the database, the persona is read afresh. Each failure is
logged as an error, so an outage shows."""

import logging

from django.core.cache import caches
from django.utils.connection import ConnectionProxy
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

# Resolved on every use, as django.core.cache.cache is, so each thread gets its own connection and a test's
# override of CACHES takes effect.
cache = ConnectionProxy(caches, "vex")

# What Django's Redis cache raises when Redis is unreachable or too slow to answer (its connection and read timeouts
# are in settings.CACHES). The in-memory cache used without Redis raises nothing of the kind.
CACHE_ERRORS = (RedisError,)


def cache_unavailable(error: Exception, fallback: str) -> None:
    """Logs one failure to reach the cache and what was done instead. No traceback: during an outage it would be the
    same one on every request."""
    logger.error("Cache unavailable (%s: %s); %s", type(error).__name__, error, fallback)
