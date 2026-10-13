import json
import logging
from collections.abc import Iterator, Mapping
from typing import Any

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.functions import ensure_session
from vex.ai.rag import get_rag_chain
from vex.api.limits import (
    QUESTION_MAX_LENGTH,
    RateLimitedMixin,
    VexDailyThrottle,
    VexSessionThrottle,
    VexThrottle,
)
from vex.utils.session import is_valid_session_key

logger = logging.getLogger(__name__)


class EventStreamRenderer(BaseRenderer):
    """Lets an EventSource (Accept: text/event-stream) through content negotiation. The stream itself bypasses
    renderers; only a refusal (400, 429) is rendered, as the same small JSON a plain client would get."""

    media_type = "text/event-stream"
    format = "sse"

    def render(
        self, data: Any, accepted_media_type: str | None = None, renderer_context: Mapping[str, Any] | None = None
    ) -> bytes:
        return json.dumps(data).encode()


class ChatStreamView(RateLimitedMixin, APIView):
    # The key still rides in the query string here, because EventSource cannot send headers; that lasts only until
    # streaming moves to a POST. EventSource also cannot read a refusal's body or status, so a 400 or 429 here
    # reaches the visitor as "unavailable". In practice they are not reached: the question POST that precedes every
    # stream is validated and throttled first, and turns the visitor away with the right code.
    renderer_classes = [JSONRenderer, EventStreamRenderer]
    throttle_scope = "vex_stream"
    throttle_classes = [VexThrottle, VexDailyThrottle, VexSessionThrottle]

    @staticmethod
    def get_session_key(request: Request) -> str | None:
        return request.query_params.get("session_key")

    def get(self, request: Request) -> StreamingHttpResponse | Response:
        if not (question := (request.query_params.get("question") or "").strip()):
            return Response({"error": "You request must contain a question."}, status=status.HTTP_400_BAD_REQUEST)
        if len(question) > QUESTION_MAX_LENGTH:
            return Response({"code": "question_too_long"}, status=status.HTTP_400_BAD_REQUEST)

        session_key = self.get_session_key(request)
        if session_key and not is_valid_session_key(session_key):
            return Response({"code": "invalid_session"}, status=status.HTTP_400_BAD_REQUEST)
        session_key = session_key or ensure_session(request=request)
        locale = request.query_params.get("locale") or settings.LANGUAGE_CODE

        def event_stream() -> Iterator[str]:
            yield "event: received\ndata: ok\n\n"
            try:
                chain = get_rag_chain()
                for chunk in chain.stream(
                    {"question": question, "locale": locale},
                    config={"configurable": {"session_id": session_key}},
                ):
                    if not chunk:
                        continue
                    yield f"data: {chunk}\n\n"
                yield "event: finished\ndata: done\n\n"
            except Exception:  # pylint: disable=broad-exception-caught
                # The provider's own message (billing, quota, keys) is for the log, never for the visitor.
                logger.exception("Vex stream failed")
                yield f"event: error\ndata: {json.dumps({'code': 'unavailable'})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"

        return response
