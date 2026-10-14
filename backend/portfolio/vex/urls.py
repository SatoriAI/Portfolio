from django.urls import path

from vex.api.sse import ChatStreamView
from vex.api.views import ChatView, MessageFeedbackView, MessageViewSet

app_name = "vex"

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("messages/", MessageViewSet.as_view(), name="messages"),
    path("messages/<int:pk>/feedback/", MessageFeedbackView.as_view(), name="feedback"),
    path("chat/stream/", ChatStreamView.as_view(), name="stream"),
]
