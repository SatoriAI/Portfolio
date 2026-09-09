from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse


class SSEChatViewTestCase(TestCase):
    def test_stream_requires_question(self) -> None:
        url = reverse("vex:stream")
        resp = self.client.get(url)  # no question param
        self.assertEqual(resp.status_code, 400)
        self.assertIn(b"must contain a question", resp.content)

    def test_stream_happy_path(self) -> None:
        url = reverse("vex:stream")

        class FakeChain:
            def stream(self, *_args, **_kwargs):
                yield "hello"
                yield ""
                yield "world"

        with patch("vex.api.sse.get_rag_chain", return_value=FakeChain()):
            resp = self.client.get(url, {"question": "Q", "session_key": "S", "locale": "en"})
            self.assertEqual(resp.status_code, 200)
            body = b"".join(resp.streaming_content)
            text = body.decode("utf-8")
            self.assertIn("event: received", text)
            self.assertIn("data: hello", text)
            self.assertIn("data: world", text)
            self.assertIn("event: finished", text)

    def test_stream_error_path(self) -> None:
        url = reverse("vex:stream")

        class BoomChain:
            def stream(self, *_args, **_kwargs):
                raise RuntimeError("boom")

        with patch("vex.api.sse.get_rag_chain", return_value=BoomChain()):
            resp = self.client.get(url, {"question": "Q"})
            self.assertEqual(resp.status_code, 200)
            text = b"".join(resp.streaming_content).decode("utf-8")
            self.assertIn("event: error", text)
            self.assertIn("boom", text)
