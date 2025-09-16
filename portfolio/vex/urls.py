from django.urls import path

from vex.api.sse import chat
from vex.api.views import ChatView, MessageViewSet

app_name = "vex"

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("messages/", MessageViewSet.as_view(), name="messages"),
    path("chat/stream/", chat, name="stream"),
]
