import json
from collections.abc import Iterator
from datetime import date
from decimal import Decimal
from typing import Any
from unittest.mock import patch

import faker
from django.conf import settings
from django.core.signals import request_finished
from django.test import TestCase, override_settings
from django.urls import reverse

from vex.ai.context import resolve_context
from vex.ai.provider import ChatMessage
from vex.ai.provider import Usage as ProviderUsage
from vex.api.limits import QUESTION_MAX_LENGTH, VexThrottle
from vex.choices import Outcomes, Roles
from vex.models import Conversation, Message, Usage
from vex.tests.factories import MessageFactory
from vex.utils.cache import cache
from work.tests.factories import ExperienceFactory

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


class FakeModel:
    """Stands in for the provider's stream: records what it was sent, then yields the given chunks and reports the
    usage, as the model's stream would."""

    def __init__(self, chunks: list[str], finish_reason: str = "end_turn") -> None:
        self.chunks, self.finish_reason = chunks, finish_reason
        self.messages: list[ChatMessage] = []

    def __call__(self, messages: list[ChatMessage], *, usage: ProviderUsage) -> Iterator[str]:
        self.messages = messages
        yield from self.chunks
        usage.input_tokens, usage.cached_tokens, usage.output_tokens = 1000, 900, len(self.chunks)
        usage.finish_reason, usage.reported = self.finish_reason, True


STREAM = "vex.ai.provider.stream_completion"
# The knowledge base reads the database and fetches the site; neither is what these tests are about.
KNOWLEDGE = "vex.ai.prompt.system_prompt"


class StreamViewTestCase(TestCase):
    url = reverse("vex:stream")

    def setUp(self) -> None:
        cache.clear()  # throttle counts live in the cache
        patcher = patch(KNOWLEDGE, side_effect=lambda locale: f"system prompt in {locale}")
        patcher.start()
        self.addCleanup(patcher.stop)

    def post(self, data: object, session: str | None = None, **extra: Any) -> Any:
        headers = {"X-Vex-Session": session} if session else {}
        return self.client.post(self.url, data=data, content_type="application/json", headers=headers, **extra)

    def stream(
        self, chunks: list[str], session: str, locale: str | None = None, **extra: Any
    ) -> tuple[list[tuple[str, Any]], FakeModel]:
        model = FakeModel(chunks)
        data = {"question": "Q"} | ({"locale": locale} if locale else {})
        with patch(STREAM, model):
            resp = self.post(data, session, **extra)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp["Content-Type"], "text/event-stream")
            body = b"".join(resp.streaming_content).decode("utf-8")
        return parse_events(body), model


class ChatStreamViewTestCase(StreamViewTestCase):
    def test_every_chunk_arrives_intact(self) -> None:
        session = session_key()
        events, _ = self.stream([*AWKWARD_CHUNKS, ""], session)
        answer = Message.objects.get(conversation__session=session, role=Roles.ASSISTANT)
        self.assertEqual(
            events,
            [
                *(("delta", {"t": chunk}) for chunk in AWKWARD_CHUNKS),
                ("done", {"message_id": answer.pk, "truncated": False}),
            ],
        )

    def test_done_names_the_saved_answer_so_it_can_be_rated(self) -> None:
        session = session_key()
        MessageFactory(conversation__session=session, role=Roles.ASSISTANT, content="Earlier")
        events, _ = self.stream(["Hi"], session)
        name, payload = events[-1]
        latest = Message.objects.filter(conversation__session=session).latest("created_at", "pk")
        self.assertEqual((name, payload), ("done", {"message_id": latest.pk, "truncated": False}))
        self.assertEqual((latest.role, latest.content), (Roles.ASSISTANT, "Hi"))

    def test_an_answer_cut_at_the_token_cap_says_so_and_is_kept_as_cut(self) -> None:
        session = session_key()
        with patch(STREAM, FakeModel(["The first part, and then", ""], finish_reason="max_tokens")):
            resp = self.post({"question": "Tell me everything"}, session)
            events = parse_events(b"".join(resp.streaming_content).decode("utf-8"))
        answer = Message.objects.get(conversation__session=session, role=Roles.ASSISTANT)
        self.assertEqual(events[-1], ("done", {"message_id": answer.pk, "truncated": True}))
        self.assertTrue(answer.truncated)
        # The history the chat loads again carries the flag, so a reloaded chat still offers to continue.
        resp = self.client.get(reverse("vex:messages"), headers={"X-Vex-Session": session})
        self.assertEqual([item["truncated"] for item in resp.json()], [False, True])

    @override_settings(VEX_MODEL="claude-haiku-5-5", VEX_PRICES={"claude-haiku-5-5": (0.10, 0.01, 0.125, 0.50)})
    def test_a_complete_answer_is_saved_after_the_conversation_so_far(self) -> None:
        session = session_key()
        earlier = MessageFactory(conversation__session=session, role=Roles.USER, content="Earlier")
        _, model = self.stream(["Hi ", "and\n\n", "there"], session, locale="pl")
        self.assertEqual(
            model.messages,
            [
                {"role": "system", "content": "system prompt in pl"},
                {"role": "user", "content": "Earlier"},
                {"role": "user", "content": "Q"},
            ],
        )
        saved = Message.objects.filter(conversation__session=session).exclude(pk=earlier.pk).order_by("created_at")
        self.assertEqual(
            [(m.role, m.content) for m in saved], [(Roles.USER, "Q"), (Roles.ASSISTANT, "Hi and\n\nthere")]
        )
        answer = saved.last()
        self.assertIsNotNone(answer)
        self.assertEqual(
            (answer.model, answer.input_tokens, answer.cached_tokens, answer.output_tokens),
            (settings.VEX_MODEL, 1000, 900, 3),
        )
        self.assertTrue(answer.prompt_version)
        record = Usage.objects.get(conversation__session=session)
        self.assertEqual(
            (record.outcome, record.finish_reason, record.input_tokens, record.cached_tokens, record.estimated),
            (Outcomes.ANSWERED, "end_turn", 1000, 900, False),
        )
        # 100 fresh input tokens at 0.10 a million, 900 cached at 0.01, 3 output at 0.50
        self.assertEqual(record.cost, Decimal("0.0000205"))

    def test_an_unknown_locale_falls_back_to_the_default(self) -> None:
        _, model = self.stream(["x"], session_key(), locale="../../etc")
        self.assertEqual(model.messages[0]["content"], "system prompt in en")

    def test_an_answer_without_text_is_an_error_and_saves_nothing(self) -> None:
        session = session_key()
        with self.assertLogs("vex.api.sse", level="ERROR"):
            events, _ = self.stream([], session)
        self.assertEqual(events, [("error", {"code": "unavailable"})])
        self.assertFalse(Message.objects.filter(conversation__session=session).exists())
        # The call was billed all the same.
        self.assertEqual(Usage.objects.get(conversation__session=session).outcome, Outcomes.EMPTY)

    def test_a_client_that_leaves_stops_the_generation_and_saves_nothing(self) -> None:
        produced: list[str] = []
        closed: list[bool] = []

        def model(_messages: list[ChatMessage], *, usage: ProviderUsage) -> Iterator[str]:
            usage.model, usage.input_tokens = settings.VEX_MODEL, 1200  # the stream opened with the prompt's counts
            try:
                for token in ("one ", "two ", "three"):
                    produced.append(token)
                    yield token
            finally:
                closed.append(True)

        session = session_key()
        with (
            patch(STREAM, model),
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
        # The answer's counts never came, so its output is the most it could be; the prompt's came as the stream opened.
        record = Usage.objects.get(conversation__session=session)
        self.assertEqual((record.outcome, record.estimated), (Outcomes.ABANDONED, True))
        self.assertEqual((record.input_tokens, record.output_tokens), (1200, settings.VEX_MAX_OUTPUT_TOKENS))
        self.assertGreater(record.cost, 0)

    def test_an_error_sends_only_a_code_and_saves_nothing(self) -> None:
        def boom(_messages: list[ChatMessage], *, usage: ProviderUsage) -> Iterator[str]:
            usage.model = settings.VEX_MODEL
            yield "partial"
            raise RuntimeError("You exceeded your current quota")

        session = session_key()
        with (
            patch(STREAM, boom),
            self.assertLogs("vex.api.sse", level="ERROR") as logs,
        ):
            resp = self.post({"question": "Q"}, session)
            text = b"".join(resp.streaming_content).decode("utf-8")
        self.assertEqual(parse_events(text), [("delta", {"t": "partial"}), ("error", {"code": "unavailable"})])
        self.assertNotIn("quota", text)
        self.assertIn("quota", "\n".join(logs.output))  # the provider's message goes to the log
        self.assertFalse(Message.objects.filter(conversation__session=session).exists())
        record = Usage.objects.get(conversation__session=session)
        self.assertEqual((record.outcome, record.estimated), (Outcomes.FAILED, True))
        self.assertEqual(record.output_tokens, settings.VEX_MAX_OUTPUT_TOKENS)

    @override_settings(VEX_MODEL="claude-haiku-5-5", VEX_PRICES={"claude-haiku-5-5": (0.10, 0.01, 0.125, 0.50)})
    def test_once_the_days_budget_is_spent_vex_rests_and_calls_nothing(self) -> None:
        session = session_key()
        with override_settings(VEX_DAILY_BUDGET_USD=Decimal("0.00001")):
            self.stream(["Hi"], session)  # $0.0000195: the budget is spent, and this answer still arrives
            for _ in range(2):  # and asking again gets the same notice
                with self.assertLogs("vex.api.sse", level="INFO") as logs:
                    events, model = self.stream(["Never sent"], session)
                self.assertEqual(events, [("error", {"code": "resting"})])
                self.assertEqual(model.messages, [])  # the model was never called
                self.assertIn("Vex is resting", "\n".join(logs.output))
            # A new conversation rests too, and is not even created.
            other = session_key()
            with self.assertLogs("vex.api.sse", level="INFO"):
                events, _ = self.stream(["x"], other)
            self.assertEqual(events, [("error", {"code": "resting"})])
            self.assertFalse(Conversation.objects.filter(session=other).exists())
        # Nothing billable and nothing half-saved: the one answered call and its exchange, no more. The conversation
        # is kept.
        self.assertEqual(Usage.objects.count(), 1)
        self.assertEqual(Message.objects.filter(conversation__session=session).count(), 2)

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
        with patch(STREAM) as model:
            for data in ({}, {"question": ""}, {"question": " \n\t "}, {"question": 5}):
                with self.subTest(data=data):
                    resp = self.post(data, session_key())
                    self.assertEqual(resp.status_code, 400)
                    self.assertEqual(resp.json(), {"code": "invalid_question"})
        model.assert_not_called()

    def test_rejects_an_overlong_question(self) -> None:
        with patch(STREAM) as model:
            resp = self.post({"question": "x" * (QUESTION_MAX_LENGTH + 1)}, session_key())
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "question_too_long"})
        model.assert_not_called()

    def test_requires_a_session_in_the_header(self) -> None:
        with patch(STREAM) as model:
            missing = self.post({"question": "Q"})
            in_body = self.post({"question": "Q", "session_key": session_key()})
        self.assertEqual(missing.json(), {"code": "session_required"})
        self.assertEqual(in_body.json(), {"code": "session_required"})
        model.assert_not_called()

    def test_rejects_a_malformed_session_without_creating_it(self) -> None:
        with patch(STREAM) as model:
            resp = self.post({"question": "Q"}, "made-up")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "invalid_session"})
        model.assert_not_called()
        self.assertEqual(Conversation.objects.count(), 0)

    # REMOTE_ADDR is the visitor, as locally with no proxy; CI runs with DEBUG off, where the header is required.
    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_is_rate_limited_per_ip_with_a_readable_wait(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_stream": "1/min"}):
            _, model = self.stream(["x"], session_key())
            resp = self.post({"question": "Q"}, session_key())
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})
        self.assertTrue(0 < int(resp["Retry-After"]) <= 60)
        self.assertTrue(model.messages)

    def test_is_rate_limited_per_session_across_ips(self) -> None:
        session = session_key()
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_stream_session": "1/min"}):
            self.stream(["x"], session, REMOTE_ADDR="10.0.0.1")
            resp = self.post({"question": "Q"}, session, REMOTE_ADDR="10.0.0.2")
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})


class AskedFromStreamTestCase(StreamViewTestCase):
    """A question asked from a role or a project, with a context naming it."""

    def ask(self, session: str, question: str, context: object = None) -> FakeModel:
        model = FakeModel(["Answer"])
        data = {"question": question} | ({"context": context} if context is not None else {})
        with patch(STREAM, model):
            resp = self.post(data, session)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(parse_events(b"".join(resp.streaming_content).decode())[-1][0], "done")
        return model

    def test_a_question_asked_from_a_role_carries_the_role_and_keeps_it_for_later_turns(self) -> None:
        role = ExperienceFactory(role="Python Web Developer", company="Gridwhistle", start=date(2020, 1, 1), end=None)
        line = resolve_context({"kind": "experience", "id": role.pk})
        session = session_key()

        model = self.ask(session, "Tell me more about his contribution.", {"kind": "experience", "id": role.pk})
        self.assertEqual(
            model.messages[-1],
            {"role": "user", "content": f"<asked_from>{line}</asked_from>\n\nTell me more about his contribution."},
        )
        self.assertEqual(sum(m["content"].count("<asked_from>") for m in model.messages), 1)
        question = Message.objects.get(conversation__session=session, role=Roles.USER)
        self.assertEqual((question.content, question.asked_from), ("Tell me more about his contribution.", line))

        # The follow-up names nothing, and reads the role back from the history.
        follow_up = self.ask(session, "And what came of it?")
        self.assertEqual(
            follow_up.messages[1:],
            [
                {"role": "user", "content": f"<asked_from>{line}</asked_from>\n\nTell me more about his contribution."},
                {"role": "assistant", "content": "Answer"},
                {"role": "user", "content": "And what came of it?"},
            ],
        )
        latest = Message.objects.filter(conversation__session=session, role=Roles.USER).latest("created_at", "pk")
        self.assertEqual(latest.asked_from, "")

    def test_a_context_naming_nothing_vex_may_read_is_dropped_not_refused(self) -> None:
        hidden = ExperienceFactory(visible=False)
        for context in ({"kind": "experience", "id": hidden.pk}, {"kind": "page", "path": "/education"}, {}):
            with self.subTest(context=context):
                session = session_key()
                model = self.ask(session, "Q", context)
                self.assertEqual(model.messages[-1], {"role": "user", "content": "Q"})
                self.assertEqual(Message.objects.get(conversation__session=session, role=Roles.USER).asked_from, "")

    def test_rejects_a_context_that_is_not_an_object_or_too_long(self) -> None:
        with patch(STREAM) as model:
            for context in ("experience 7", 7, ["experience", 7], {"kind": "experience", "id": 7, "x": "y" * 200}):
                with self.subTest(context=context):
                    resp = self.post({"question": "Q", "context": context}, session_key())
                    self.assertEqual(resp.status_code, 400)
                    self.assertEqual(resp.json(), {"code": "invalid_context"})
        model.assert_not_called()
