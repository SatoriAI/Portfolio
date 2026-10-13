import json
import logging
import time
from collections.abc import Iterator, Mapping
from contextlib import closing

from django.conf import settings
from django.http import StreamingHttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from vex.ai.rag import stream_answer
from vex.api.limits import (
    SESSION_HEADER,
    RateLimitedMixin,
    VexDailyThrottle,
    VexSessionThrottle,
    VexThrottle,
    body_field,
    question_refusal,
)
from vex.utils.session import is_valid_session_key

logger = logging.getLogger(__name__)

# The longest one answer may stream. Under gunicorn's threaded workers the worker timeout no longer bounds a request
# (the worker stays alive while a thread streams), so this is what stops one answer holding a thread indefinitely.
# It is checked between chunks; a provider that stalls mid-answer is bounded instead by the client's read timeout
# (vex.ai.provider), which ends the stream with an error.
STREAM_MAX_SECONDS = 120


def sse_event(event: str, data: Mapping[str, object]) -> str:
    """One server-sent event. The payload is always JSON on a single data line: json.dumps escapes every newline,
    so no text the model writes can end an event early or start a field of its own."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@extend_schema(summary="Stream an answer", tags=["Vex"])
class ChatStreamView(RateLimitedMixin, APIView):
    """Answers one question as a text/event-stream: `delta` events carrying `{"t": text}`, then `done`, or an
    `error` carrying only `{"code": …}`. A POST, so the question rides in the body and the conversation in the
    X-Vex-Session header (as for the history), and neither lands in an access log. A refusal (400, 429) comes back
    as ordinary JSON with its status, which fetch can read."""

    throttle_scope = "vex_stream"
    throttle_classes = [VexThrottle, VexDailyThrottle, VexSessionThrottle]

    @staticmethod
    def get_session_key(request: Request) -> str | None:
        return request.headers.get(SESSION_HEADER)

    def post(self, request: Request) -> StreamingHttpResponse | Response:
        question = body_field(request, "question")
        if refusal := question_refusal(question):
            return refusal

        session_key = self.get_session_key(request)
        if not session_key:
            return Response({"code": "session_required"}, status=status.HTTP_400_BAD_REQUEST)
        if not is_valid_session_key(session_key):
            return Response({"code": "invalid_session"}, status=status.HTTP_400_BAD_REQUEST)

        locale = body_field(request, "locale")
        if locale not in dict(settings.LANGUAGES):
            locale = settings.LANGUAGE_CODE

        response = StreamingHttpResponse(
            self.events(question=question, locale=locale, session_key=session_key),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    @staticmethod
    def events(question: str, locale: str, session_key: str) -> Iterator[str]:
        deadline = time.monotonic() + STREAM_MAX_SECONDS
        try:
            # A visitor who leaves surfaces here as GeneratorExit, raised by the server at the next write: closing
            # the answer's stream on the way out stops the generation and saves nothing (see stream_answer).
            with closing(stream_answer(question=question, locale=locale, session_key=session_key)) as chunks:
                for chunk in chunks:
                    yield sse_event("delta", {"t": chunk})
                    if time.monotonic() > deadline:
                        logger.warning("Vex stream stopped after %ss", STREAM_MAX_SECONDS)
                        yield sse_event("error", {"code": "timeout"})
                        return
            yield sse_event("done", {})
        except GeneratorExit:
            # A warning, so it reaches the log without a LOGGING setting: an abandoned answer still cost a call.
            logger.warning("Vex stream stopped: the client went away mid-answer")
            raise
        except Exception:  # pylint: disable=broad-exception-caught
            # The provider's own message (billing, quota, keys) is for the log, never for the visitor.
            logger.exception("Vex stream failed")
            yield sse_event("error", {"code": "unavailable"})
