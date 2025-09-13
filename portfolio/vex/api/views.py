from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.functions import ensure_session
from vex.ai.rag import rag_chain


@extend_schema(summary="Update Chat", tags=["Vex"])
class ChatView(APIView):
    def post(self, request):
        if not (question := (request.data.get("question") or "").strip()):
            return Response({"error": "Empty question"}, status=status.HTTP_400_BAD_REQUEST)

        session_id = ensure_session(request)

        answer = rag_chain.invoke(
            input=question,
            config={"configurable": {"session_id": session_id}},
        )

        return Response({"answer": answer, "session_id": session_id, "csrftoken": get_token(request)})
