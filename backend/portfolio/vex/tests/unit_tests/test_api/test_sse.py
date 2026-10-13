import json
from collections.abc import Iterator
from typing import Any
from unittest.mock import patch

import faker
from django.core.cache import cache
from django.core.signals import request_finished
from django.test import TestCase, override_settings
from django.urls import reverse
from langchain_core.runnables import RunnableGenerator

from vex.api.limits import QUESTION_MAX_LENGTH, VexThrottle
from vex.choices import Roles
from vex.models import Conversation, Message
from vex.tests.factories import MessageFactory

fake = faker.Faker()

# Chunks a transport that writes raw `data:` lines would corrupt: a blank line ends an event early, a newline starts
# a line the browser drops, and anything shaped like JSON was once unwrapped by a client guessing at the payload.
AWKWARD_CHUNKS = [
    "## Heading\n\n",
    "- one\n- two\n",
    'He said "quoted"',
    " a literal \\n stays two characters",
    '{"text": "not a payload"}',
    "\r\nwindows line\r\n",
    "data: not a field\n\nevent: nor this",
    "zażółć",
]


def session_key() -> str:
    return fake.uuid4().replace("-", "")


def parse_events(body: str) -> list[tuple[str, Any]]:
    """The events of a stream, as (name, decoded JSON payload), read the way a browser reads them."""
    events = []
    for block in body.split("\n\n"):
        if not block:
            continue
        lines = block.split("\n")
        name = next(line[len("event: ") :] for line in lines if line.startswith("event: "))
        # Exactly one data line per event, or the unpacking fails.
        (data,) = [line[len("data: ") :] for line in lines if line.startswith("data: ")]
        events.append((name, json.loads(data)))
    return events


class FakeChain:
    """Stands in for the LangChain pipeline: yields the given chunks, as the model's stream would."""

    def __init__(self, chunks: list[str]) -> None:
        self.chunks = chunks
        self.inputs: dict[str, Any] = {}

    def stream(self, inputs: dict[str, Any]) -> Iterator[str]:
        self.inputs = inputs
        yield from self.chunks


class ChatStreamViewTestCase(TestCase):
    url = reverse("vex:stream")

    def setUp(self) -> None:
        cache.clear()  # throttle counts live in the cache

    def post(self, data: object, session: str | None = None, **extra: Any) -> Any:
        headers = {"X-Vex-Session": session} if session else {}
        return self.client.post(self.url, data=data, content_type="application/json", headers=headers, **extra)

    def stream(
        self, chunks: list[str], session: str, locale: str | None = None, **extra: Any
    ) -> tuple[list[tuple[str, Any]], FakeChain]:
        chain = FakeChain(chunks)
        data = {"question": "Q"} | ({"locale": locale} if locale else {})
        with patch("vex.ai.rag.get_rag_chain", return_value=chain):
            resp = self.post(data, session, **extra)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp["Content-Type"], "text/event-stream")
            body = b"".join(resp.streaming_content).decode("utf-8")
        return parse_events(body), chain

    def test_every_chunk_arrives_intact(self) -> None:
        events, _ = self.stream([*AWKWARD_CHUNKS, ""], session_key())
        self.assertEqual(events, [*(("delta", {"t": chunk}) for chunk in AWKWARD_CHUNKS), ("done", {})])

    def test_a_complete_answer_is_saved_after_the_conversation_so_far(self) -> None:
        session = session_key()
        earlier = MessageFactory(conversation__session=session, role=Roles.USER, content="Earlier")
        _, chain = self.stream(["Hi ", "and\n\n", "there"], session, locale="pl")
        self.assertEqual(chain.inputs["question"], "Q")
        self.assertEqual(chain.inputs["locale"], "pl")
        self.assertEqual([m.content for m in chain.inputs["history"]], ["Earlier"])
        saved = Message.objects.filter(conversation__session=session).exclude(pk=earlier.pk).order_by("created_at")
        self.assertEqual(
            [(m.role, m.content) for m in saved], [(Roles.USER, "Q"), (Roles.ASSISTANT, "Hi and\n\nthere")]
        )

    def test_an_unknown_locale_falls_back_to_the_default(self) -> None:
        _, chain = self.stream(["x"], session_key(), locale="../../etc")
        self.assertEqual(chain.inputs["locale"], "en")

    def test_a_client_that_leaves_stops_the_generation_and_saves_nothing(self) -> None:
        produced: list[str] = []
        closed: list[bool] = []

        def model(_inputs: Iterator[Any]) -> Iterator[str]:
            try:
                for token in ("one ", "two ", "three"):
                    produced.append(token)
                    yield token
            finally:
                closed.append(True)

        session = session_key()
        with (
            patch("vex.ai.rag.get_rag_chain", return_value=RunnableGenerator(model)),
            self.assertLogs("vex.api.sse", level="WARNING") as logs,
        ):
            resp = self.post({"question": "Q"}, session)
            stream = iter(resp.streaming_content)
            self.assertIn(b"one", next(stream))
            # What the server does when the socket breaks. The signal it sends would close the test's database
            # connection, so it is held back here.
            with patch.object(request_finished, "send"):
                resp.close()
        self.assertEqual(produced, ["one "])
        self.assertEqual(closed, [True])
        self.assertFalse(Message.objects.filter(conversation__session=session).exists())
        self.assertIn("client went away", "\n".join(logs.output))

    def test_an_error_sends_only_a_code_and_saves_nothing(self) -> None:
        class BoomChain:
            def stream(self, _inputs: dict[str, Any]) -> Iterator[str]:
                yield "partial"
                raise RuntimeError("You exceeded your current quota")

        session = session_key()
        with (
            patch("vex.ai.rag.get_rag_chain", return_value=BoomChain()),
            self.assertLogs("vex.api.sse", level="ERROR") as logs,
        ):
            resp = self.post({"question": "Q"}, session)
            text = b"".join(resp.streaming_content).decode("utf-8")
        self.assertEqual(parse_events(text), [("delta", {"t": "partial"}), ("error", {"code": "unavailable"})])
        self.assertNotIn("quota", text)
        self.assertIn("quota", "\n".join(logs.output))  # the provider's message goes to the log
        self.assertFalse(Message.objects.filter(conversation__session=session).exists())

    def test_an_answer_that_runs_too_long_is_cut_with_a_timeout(self) -> None:
        with (
            patch("vex.api.sse.STREAM_MAX_SECONDS", -1),
            self.assertLogs("vex.api.sse", level="WARNING"),
        ):
            events, _ = self.stream(["a", "b"], session_key())
        self.assertEqual(events, [("delta", {"t": "a"}), ("error", {"code": "timeout"})])

    def test_the_get_stream_is_gone(self) -> None:
        resp = self.client.get(self.url, {"question": "Q", "session_key": session_key()})
        self.assertEqual(resp.status_code, 405)

    def test_requires_a_question(self) -> None:
        with patch("vex.ai.rag.get_rag_chain") as chain:
            for data in ({}, {"question": ""}):
                with self.subTest(data=data):
                    self.assertEqual(self.post(data, session_key()).status_code, 400)
            resp = self.post({"question": 5}, session_key())
        self.assertEqual(resp.json(), {"code": "invalid_question"})
        chain.assert_not_called()

    def test_rejects_an_overlong_question(self) -> None:
        with patch("vex.ai.rag.get_rag_chain") as chain:
            resp = self.post({"question": "x" * (QUESTION_MAX_LENGTH + 1)}, session_key())
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "question_too_long"})
        chain.assert_not_called()

    def test_requires_a_session_in_the_header(self) -> None:
        with patch("vex.ai.rag.get_rag_chain") as chain:
            missing = self.post({"question": "Q"})
            in_body = self.post({"question": "Q", "session_key": session_key()})
        self.assertEqual(missing.json(), {"code": "session_required"})
        self.assertEqual(in_body.json(), {"code": "session_required"})
        chain.assert_not_called()

    def test_rejects_a_malformed_session_without_creating_it(self) -> None:
        with patch("vex.ai.rag.get_rag_chain") as chain:
            resp = self.post({"question": "Q"}, "made-up")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "invalid_session"})
        chain.assert_not_called()
        self.assertEqual(Conversation.objects.count(), 0)

    # REMOTE_ADDR is the visitor, as locally with no proxy; CI runs with DEBUG off, where the header is required.
    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_is_rate_limited_per_ip_with_a_readable_wait(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_stream": "1/min"}):
            _, chain = self.stream(["x"], session_key())
            resp = self.post({"question": "Q"}, session_key())
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})
        self.assertTrue(0 < int(resp["Retry-After"]) <= 60)
        self.assertTrue(chain.inputs)

    def test_is_rate_limited_per_session_across_ips(self) -> None:
        session = session_key()
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_stream_session": "1/min"}):
            self.stream(["x"], session, REMOTE_ADDR="10.0.0.1")
            resp = self.post({"question": "Q"}, session, REMOTE_ADDR="10.0.0.2")
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})
