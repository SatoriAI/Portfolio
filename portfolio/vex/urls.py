from django.urls import path

from vex.api.sse import chat
from vex.api.views import ChatView

app_name = "vex"

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("chat/stream/", chat, name="chat_stream"),
]
