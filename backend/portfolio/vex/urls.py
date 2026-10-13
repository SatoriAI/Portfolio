from django.urls import path

from vex.api.sse import ChatStreamView
from vex.api.views import ChatView, MessageViewSet

app_name = "vex"

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("messages/", MessageViewSet.as_view(), name="messages"),
    path("chat/stream/", ChatStreamView.as_view(), name="stream"),
]
