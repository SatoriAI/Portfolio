import functools
import logging
import math
from collections.abc import Mapping
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from vex.utils.cache import CACHE_ERRORS, cache_unavailable
from vex.utils.cache import cache as vex_cache
from vex.utils.session import is_valid_session_key

logger = logging.getLogger(__name__)

SESSION_HEADER = "X-Vex-Session"
QUESTION_MAX_LENGTH = 1000


def body_field(request: Request, name: str) -> Any:
    """One field of a request body, or None when the body is not an object at all (a JSON list, a bare string)."""
    return request.data.get(name) if isinstance(request.data, Mapping) else None


def question_refusal(question: object) -> Response | None:
    """Why a question cannot be put to the model, as the 400 that says so, or None when it can."""
    if question is not None and not isinstance(question, str):
        return Response({"code": "invalid_question"}, status=status.HTTP_400_BAD_REQUEST)
    if not question or not question.strip():
        return Response({"code": "invalid_question"}, status=status.HTTP_400_BAD_REQUEST)
    if len(question) > QUESTION_MAX_LENGTH:
        return Response({"code": "question_too_long"}, status=status.HTTP_400_BAD_REQUEST)
    return None


@functools.cache
def warn_missing_ip_header(header: str) -> None:
    """Said once per process: logged on every request, it would flood the log."""
    logger.warning("%s is missing from requests; Vex's per-IP limits are skipped for them", header)


class VexThrottle(SimpleRateThrottle):
    """A per-IP limit on one Vex endpoint. The view names the endpoint (`throttle_scope`) and a subclass's `suffix`
    picks which of its rates in DEFAULT_THROTTLE_RATES applies, so one endpoint can carry several windows."""

    suffix = ""
    # Counted in Redis in production, so every worker and thread shares one count (see settings.CACHES).
    cache = vex_cache

    def __init__(self) -> None:  # pylint: disable=super-init-not-called
        # The rate depends on the view, so it is resolved per request in allow_request.
        pass

    def allow_request(self, request: Request, view: Any) -> bool:
        self.scope = f"{view.throttle_scope}{self.suffix}"
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)
        try:
            return super().allow_request(request, view)
        except CACHE_ERRORS as error:
            # Counts live in Redis. Without it Vex stays up unlimited rather than down; the daily budget, which falls
            # back to the database, still bounds what that can cost.
            cache_unavailable(error, f"the {self.scope} limit is skipped")
            return True

    def get_ident(self, request: Request) -> str | None:
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

    def get_cache_key(self, request: Request, view: Any) -> str | None:
        if (ident := self.get_ident(request)) is None:
            return None  # SimpleRateThrottle lets a request without a cache key through
        return self.cache_format % {"scope": self.scope, "ident": ident}


class VexDailyThrottle(VexThrottle):
    suffix = "_daily"


class VexSessionThrottle(VexThrottle):
    """The same kind of limit, counted per conversation rather than per IP."""

    suffix = "_session"

    def get_cache_key(self, request: Request, view: Any) -> str | None:
        key = view.get_session_key(request)
        if not is_valid_session_key(key):
            return None
        return self.cache_format % {"scope": self.scope, "ident": key}


class RateLimitedMixin:
    """Answers a throttled request with a code the site translates, instead of DRF's English sentence."""

    def throttled(self, request: Request, wait: float | None) -> None:
        exc = Throttled(detail={"code": "rate_limited"})
        exc.wait = math.ceil(wait) if wait else None  # still sent as Retry-After
        raise exc
