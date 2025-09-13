from django.http import HttpRequest


def ensure_session(request: HttpRequest) -> str | None:
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key
