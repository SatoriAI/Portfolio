import functools
import logging
import math
from collections.abc import Mapping
from typing import Any

from django.conf import settings
from rest_framework.exceptions import Throttled
from rest_framework.throttling import SimpleRateThrottle

from vex.utils.session import is_valid_session_key

logger = logging.getLogger(__name__)

SESSION_HEADER = "X-Vex-Session"
QUESTION_MAX_LENGTH = 1000


def body_field(request, name: str) -> Any:
    """One field of a request body, or None when the body is not an object at all (a JSON list, a bare string)."""
    return request.data.get(name) if isinstance(request.data, Mapping) else None


@functools.cache
def warn_missing_ip_header(header: str) -> None:
    """Said once per process: logged on every request, it would flood the log."""
    logger.warning("%s is missing from requests; Vex's per-IP limits are skipped for them", header)


class VexThrottle(SimpleRateThrottle):
    """A per-IP limit on one Vex endpoint. The view names the endpoint (`throttle_scope`) and a subclass's `suffix`
    picks which of its rates in DEFAULT_THROTTLE_RATES applies, so one endpoint can carry several windows."""

    suffix = ""

    def __init__(self) -> None:  # pylint: disable=super-init-not-called
        # The rate depends on the view, so it is resolved per request in allow_request.
        pass

    def allow_request(self, request, view) -> bool:
        self.scope = f"{view.throttle_scope}{self.suffix}"
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super().allow_request(request, view)

    def get_ident(self, request) -> str | None:
        # Behind Railway's edge REMOTE_ADDR is the proxy, and X-Forwarded-For can carry whatever the client sent.
        # Only the header the edge itself sets (X-Real-IP) names the visitor. Locally (no header configured) there
        # is no proxy at all, so REMOTE_ADDR is the visitor.
        if not (header := settings.TRUSTED_CLIENT_IP_HEADER):
            return request.META.get("REMOTE_ADDR", "")
        if ip := request.headers.get(header, "").strip():
            return ip
        # With the header configured but absent, REMOTE_ADDR would be the proxy: every visitor would share one
        # count, and one of them could lock everyone out. No identity means no per-IP limit for this request; the
        # per-session limits still apply.
        warn_missing_ip_header(header)
        return None

    def get_cache_key(self, request, view) -> str | None:
        if (ident := self.get_ident(request)) is None:
            return None  # SimpleRateThrottle lets a request without a cache key through
        return self.cache_format % {"scope": self.scope, "ident": ident}


class VexDailyThrottle(VexThrottle):
    suffix = "_daily"


class VexSessionThrottle(VexThrottle):
    """The same kind of limit, counted per conversation rather than per IP."""

    suffix = "_session"

    def get_cache_key(self, request, view) -> str | None:
        key = view.get_session_key(request)
        if not is_valid_session_key(key):
            return None
        return self.cache_format % {"scope": self.scope, "ident": key}


class RateLimitedMixin:
    """Answers a throttled request with a code the site translates, instead of DRF's English sentence."""

    def throttled(self, request, wait: float | None) -> None:
        exc = Throttled(detail={"code": "rate_limited"})
        exc.wait = math.ceil(wait) if wait else None  # still sent as Retry-After
        raise exc
