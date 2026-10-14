from collections.abc import Mapping

from django.db.models import QuerySet
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.functions import ensure_session
from vex.api.limits import (
    SESSION_HEADER,
    RateLimitedMixin,
    VexDailyThrottle,
    VexSessionThrottle,
    VexThrottle,
    body_field,
    question_refusal,
)
from vex.api.serializers import MessageSerializer
from vex.choices import Feedback, Roles
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
        if refusal := question_refusal(body_field(request, "question")):
            return refusal

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


@extend_schema(summary="Rate one answer", tags=["Vex"])
class MessageFeedbackView(RateLimitedMixin, APIView):
    """A visitor's thumbs up or down on one of Vex's answers: `{"value": "up" | "down" | null}`, null taking the
    rating back. Only the conversation named by the X-Vex-Session header may rate its own answers; any other message
    (someone else's, a question, one that does not exist) is a 404, so the endpoint never says which ids exist."""

    throttle_scope = "vex_feedback"
    throttle_classes = [VexThrottle, VexSessionThrottle]

    @staticmethod
    def get_session_key(request: Request) -> str | None:
        return request.headers.get(SESSION_HEADER)

    def post(self, request: Request, pk: int) -> Response:
        session_key = self.get_session_key(request)
        if not session_key:
            return Response({"code": "session_required"}, status=status.HTTP_400_BAD_REQUEST)
        if not is_valid_session_key(session_key):
            return Response({"code": "invalid_session"}, status=status.HTTP_400_BAD_REQUEST)

        # The value must be sent, even as null: a body without it is a mistake, not a request to take a rating back.
        if not isinstance(request.data, Mapping) or "value" not in request.data:
            return Response({"code": "invalid_feedback"}, status=status.HTTP_400_BAD_REQUEST)
        value = request.data["value"]
        if value is not None and value not in Feedback.values:
            return Response({"code": "invalid_feedback"}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.filter(pk=pk, conversation__session=session_key, role=Roles.ASSISTANT).first()
        if message is None:
            raise NotFound({"code": "not_found"})
        message.feedback = value or ""
        message.save(update_fields=["feedback", "updated_at"])
        return Response({"id": message.pk, "feedback": value})
