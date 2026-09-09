from collections.abc import Iterator

from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponseBadRequest, StreamingHttpResponse

from utils.functions import ensure_session
from vex.ai.rag import get_rag_chain


def chat(request: WSGIRequest) -> StreamingHttpResponse | HttpResponseBadRequest:
    if not (question := (request.GET.get(key="question") or "").strip()):
        return HttpResponseBadRequest(content="You request must contain a question.")

    session_key = request.GET.get(key="session_key") or ensure_session(request=request)
    locale = request.GET.get(key="locale") or settings.LANGUAGE_CODE

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
        except Exception as e:  # pylint: disable=broad-exception-caught
            yield f"event: error\ndata: {str(e)}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"

    return response
