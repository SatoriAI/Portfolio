from django.http import HttpRequest, JsonResponse, StreamingHttpResponse
from rest_framework import status

from utils.functions import ensure_session
from vex.ai.rag import rag_chain


def chat(request: HttpRequest):
    question = (request.GET.get(key="question") or "").strip()

    if not question:
        return JsonResponse({"error": "Empty question"}, status=status.HTTP_400_BAD_REQUEST)

    session_id = ensure_session(request)

    def event_stream():
        yield "event: received"
        try:
            for chunk in rag_chain.stream(question, config={"configurable": {"session_id": session_id}}):
                if not chunk:
                    continue
                yield f"data: {chunk}\n\n"
            yield "event: finished"
        except Exception as e:
            yield f"event: error\nDetail: {str(e)}"

    resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    resp["Cache-Control"] = "no-cache"
    resp["X-Accel-Buffering"] = "no"
    return resp
