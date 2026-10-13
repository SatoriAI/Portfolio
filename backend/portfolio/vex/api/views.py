from django.db.models import QuerySet
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.functions import ensure_session
from vex.api.limits import (
    QUESTION_MAX_LENGTH,
    SESSION_HEADER,
    RateLimitedMixin,
    VexDailyThrottle,
    VexSessionThrottle,
    VexThrottle,
    body_field,
)
from vex.api.serializers import MessageSerializer
from vex.models import Message
from vex.utils.session import is_valid_session_key


@extend_schema(summary="Receive the Session Key", tags=["Vex"])
class ChatView(RateLimitedMixin, APIView):
    throttle_scope = "vex_chat"
    throttle_classes = [VexThrottle, VexDailyThrottle, VexSessionThrottle]

    @staticmethod
    def get_session_key(request: Request) -> object:
        # Not necessarily a string: a JSON body can send a number or a list here.
        return body_field(request, "session_key")

    def post(self, request: Request) -> Response:
        question = body_field(request, "question")
        if question is not None and not isinstance(question, str):
            return Response({"code": "invalid_question"}, status=status.HTTP_400_BAD_REQUEST)
        if not question:
            return Response({"error": "Empty question"}, status=status.HTTP_400_BAD_REQUEST)
        if len(question) > QUESTION_MAX_LENGTH:
            return Response({"code": "question_too_long"}, status=status.HTTP_400_BAD_REQUEST)

        session_key = self.get_session_key(request)
        if session_key not in (None, "") and not is_valid_session_key(session_key):
            return Response({"code": "invalid_session"}, status=status.HTTP_400_BAD_REQUEST)

        if not (session_key := session_key or request.session.session_key):
            session_key = ensure_session(request=request)

        return Response({"session_key": session_key, "csrftoken": get_token(request=request)})


@extend_schema(summary="List one conversation's messages", tags=["Vex"])
class MessageViewSet(RateLimitedMixin, ListAPIView):
    """The history of the conversation named by the X-Vex-Session header — never anyone else's. The key travels in a
    header rather than the query string so it stays out of access logs."""

    serializer_class = MessageSerializer
    throttle_scope = "vex_history"
    throttle_classes = [VexThrottle, VexSessionThrottle]

    @staticmethod
    def get_session_key(request: Request) -> str | None:
        return request.headers.get(SESSION_HEADER)

    def get_queryset(self) -> QuerySet[Message]:
        session_key = self.get_session_key(self.request)
        if not session_key:
            raise ValidationError({"code": "session_required"})
        if not is_valid_session_key(session_key):
            raise ValidationError({"code": "invalid_session"})
        return Message.objects.filter(conversation__session=session_key).order_by("created_at")
