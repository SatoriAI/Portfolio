import math

from django.conf import settings
from rest_framework.exceptions import Throttled
from rest_framework.throttling import SimpleRateThrottle

from vex.utils.session import is_valid_session_key

SESSION_HEADER = "X-Vex-Session"
QUESTION_MAX_LENGTH = 1000


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

    def get_ident(self, request) -> str:
        # Behind Railway's edge REMOTE_ADDR is the proxy, and X-Forwarded-For can carry whatever the client sent.
        # Only the header the edge itself sets (X-Real-IP) names the visitor; locally there is no proxy at all.
        if header := settings.TRUSTED_CLIENT_IP_HEADER:
            if ip := request.headers.get(header, "").strip():
                return ip
        return request.META.get("REMOTE_ADDR", "")

    def get_cache_key(self, request, view) -> str:
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


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
