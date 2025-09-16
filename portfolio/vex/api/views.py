from django.middleware.csrf import get_token
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status
from rest_framework.generics import ListAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.functions import ensure_session
from vex.api.filters import MessageFilter
from vex.api.serializers import MessageSerializer
from vex.models import Message


@extend_schema(summary="Receive the Session Key", tags=["Vex"])
class ChatView(APIView):
    @staticmethod
    def post(request: Request) -> Response:
        if not request.data.get("question"):
            return Response({"error": "Empty question"}, status=status.HTTP_400_BAD_REQUEST)

        if not (session_key := request.data.get("session_key") or request.session.session_key):
            session_key = ensure_session(request=request)

        return Response({"session_key": session_key, "csrftoken": get_token(request=request)})


@extend_schema(summary="List Messages", tags=["Vex"])
class MessageViewSet(ListAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    filterset_class = MessageFilter
    ordering_fields = [
        "created_at",
    ]
    ordering = [
        "created_at",
    ]
