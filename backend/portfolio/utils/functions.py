from django.core.handlers.wsgi import WSGIRequest
from rest_framework.request import Request


def ensure_session(request: Request | WSGIRequest) -> str | None:
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key
