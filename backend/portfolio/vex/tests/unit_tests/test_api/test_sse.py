from unittest.mock import patch

import faker
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse

from vex.api.limits import QUESTION_MAX_LENGTH, VexThrottle
from vex.models import Conversation

fake = faker.Faker()


class SSEChatViewTestCase(TestCase):
    url = reverse("vex:stream")

    def setUp(self) -> None:
        cache.clear()  # throttle counts live in the cache

    def test_stream_requires_question(self) -> None:
        resp = self.client.get(self.url)  # no question param
        self.assertEqual(resp.status_code, 400)
        self.assertIn(b"must contain a question", resp.content)

    def test_stream_happy_path(self) -> None:
        class FakeChain:
            def stream(self, *_args, **_kwargs):
                yield "hello"
                yield ""
                yield "world"

        session = fake.uuid4().replace("-", "")
        with patch("vex.api.sse.get_rag_chain", return_value=FakeChain()):
            resp = self.client.get(
                self.url, {"question": "Q", "session_key": session, "locale": "en"}, HTTP_ACCEPT="text/event-stream"
            )
            self.assertEqual(resp.status_code, 200)
            text = b"".join(resp.streaming_content).decode("utf-8")
            self.assertIn("event: received", text)
            self.assertIn("data: hello", text)
            self.assertIn("data: world", text)
            self.assertIn("event: finished", text)

    def test_stream_error_sends_only_a_code(self) -> None:
        class BoomChain:
            def stream(self, *_args, **_kwargs):
                raise RuntimeError("You exceeded your current quota")

        with (
            patch("vex.api.sse.get_rag_chain", return_value=BoomChain()),
            self.assertLogs("vex.api.sse", level="ERROR") as logs,
        ):
            resp = self.client.get(self.url, {"question": "Q"})
            self.assertEqual(resp.status_code, 200)
            text = b"".join(resp.streaming_content).decode("utf-8")
        self.assertIn('event: error\ndata: {"code": "unavailable"}\n\n', text)
        self.assertNotIn("quota", text)
        self.assertIn("quota", "\n".join(logs.output))  # the provider's message goes to the log

    def test_stream_rejects_overlong_question(self) -> None:
        with patch("vex.api.sse.get_rag_chain") as chain:
            resp = self.client.get(self.url, {"question": "x" * (QUESTION_MAX_LENGTH + 1)})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "question_too_long"})
        chain.assert_not_called()

    def test_stream_rejects_malformed_session_without_creating_it(self) -> None:
        with patch("vex.api.sse.get_rag_chain") as chain:
            resp = self.client.get(self.url, {"question": "Q", "session_key": "made-up"})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "invalid_session"})
        chain.assert_not_called()
        self.assertEqual(Conversation.objects.count(), 0)

    # REMOTE_ADDR is the visitor, as locally with no proxy; CI runs with DEBUG off, where the header is required.
    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_stream_is_rate_limited_for_an_event_source(self) -> None:
        with (
            patch("vex.api.sse.get_rag_chain") as chain,
            patch.dict(VexThrottle.THROTTLE_RATES, {"vex_stream": "1/min"}),
        ):
            first = self.client.get(self.url, {"question": "Q"}, HTTP_ACCEPT="text/event-stream")
            b"".join(first.streaming_content)
            resp = self.client.get(self.url, {"question": "Q"}, HTTP_ACCEPT="text/event-stream")
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.content, b'{"code": "rate_limited"}')
        self.assertEqual(chain.call_count, 1)
