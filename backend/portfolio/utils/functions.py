from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpRequest
from rest_framework.request import Request


def ensure_session(request: Request | WSGIRequest) -> str | None:
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


def client_ip(request: Request | HttpRequest) -> str | None:
    """The visitor's IP, from the header TRUSTED_CLIENT_IP_HEADER names, or None when that header is configured but
    missing from the request.

    Behind Railway's edge REMOTE_ADDR is the proxy, and X-Forwarded-For can carry whatever the client sent. Only the
    header the edge itself sets (X-Real-IP) names the visitor. Locally (no header configured) there is no proxy at
    all, so REMOTE_ADDR is the visitor. With the header configured but absent, REMOTE_ADDR would be the proxy, shared
    by every visitor, so it never stands in for it."""
    if not (header := settings.TRUSTED_CLIENT_IP_HEADER):
        return str(request.META.get("REMOTE_ADDR", ""))
    return request.headers.get(header, "").strip() or None
