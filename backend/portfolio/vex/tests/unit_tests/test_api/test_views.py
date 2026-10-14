from unittest.mock import patch

import faker
from django.test import TestCase, override_settings
from django.urls import reverse

from vex.api.limits import QUESTION_MAX_LENGTH, VexThrottle, warn_missing_ip_header
from vex.choices import Feedback, Roles
from vex.models import Conversation, Message
from vex.tests.factories import ConversationFactory, MessageFactory
from vex.utils.cache import cache

fake = faker.Faker()


def session_key() -> str:
    return fake.uuid4().replace("-", "")


class ChatViewTestCase(TestCase):
    def setUp(self) -> None:
        cache.clear()  # throttle counts live in the cache

    def test_post_requires_question(self) -> None:
        url = reverse("vex:chat")
        resp = self.client.post(url, data={})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "invalid_question"})

    def test_post_returns_session_and_csrf(self) -> None:
        url = reverse("vex:chat")
        resp = self.client.post(url, data={"question": "Hello"})
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn("session_key", body)
        self.assertIn("csrftoken", body)
        self.assertRegex(body["session_key"], r"^[a-z0-9]{32}$")

    def test_post_honors_existing_session(self) -> None:
        session = session_key()
        url = reverse("vex:chat")
        resp = self.client.post(url, data={"question": "Hi", "session_key": session})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["session_key"], session)

    def test_post_rejects_malformed_session(self) -> None:
        url = reverse("vex:chat")
        resp = self.client.post(url, data={"question": "Hi", "session_key": "anything-at-all"})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "invalid_session"})

    def test_post_rejects_overlong_question(self) -> None:
        url = reverse("vex:chat")
        resp = self.client.post(url, data={"question": "x" * (QUESTION_MAX_LENGTH + 1)})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "question_too_long"})

    def test_post_rejects_a_question_that_is_not_text(self) -> None:
        url = reverse("vex:chat")
        for question in (5, ["x"], {"text": "x"}):
            with self.subTest(question=question):
                resp = self.client.post(url, data={"question": question}, content_type="application/json")
                self.assertEqual(resp.status_code, 400)
                self.assertEqual(resp.json(), {"code": "invalid_question"})

    def test_post_rejects_a_session_key_that_is_not_text(self) -> None:
        url = reverse("vex:chat")
        for key in (123, 0, ["a" * 32], {"k": "v"}):
            with self.subTest(session_key=key):
                resp = self.client.post(
                    url, data={"question": "Hi", "session_key": key}, content_type="application/json"
                )
                self.assertEqual(resp.status_code, 400)
                self.assertEqual(resp.json(), {"code": "invalid_session"})
        self.assertEqual(Conversation.objects.count(), 0)

    def test_post_with_a_body_that_is_not_an_object(self) -> None:
        resp = self.client.post(reverse("vex:chat"), data=["Hi"], content_type="application/json")
        self.assertEqual(resp.status_code, 400)

    # REMOTE_ADDR is the visitor, as locally with no proxy; CI runs with DEBUG off, where the header is required.
    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_post_is_rate_limited_per_ip(self) -> None:
        url = reverse("vex:chat")
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_chat": "2/min"}):
            for _ in range(2):
                self.assertEqual(self.client.post(url, data={"question": "Hi"}).status_code, 200)
            resp = self.client.post(url, data={"question": "Hi"})
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})
        self.assertIn("Retry-After", resp.headers)


class MessageListViewTestCase(TestCase):
    url = reverse("vex:messages")

    def setUp(self) -> None:
        cache.clear()

    def get(self, session: str | None = None, **extra):
        headers = {"X-Vex-Session": session} if session is not None else {}
        return self.client.get(self.url, headers=headers, **extra)

    def test_without_a_session_lists_nothing(self) -> None:
        MessageFactory()
        resp = self.get()
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "session_required"})

    def test_session_in_the_query_string_is_not_accepted(self) -> None:
        conv = ConversationFactory()
        MessageFactory(conversation=conv)
        resp = self.client.get(self.url, {"session": conv.session})
        self.assertEqual(resp.status_code, 400)

    def test_malformed_session_is_rejected(self) -> None:
        resp = self.get("not a session key")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json(), {"code": "invalid_session"})

    def test_unknown_session_is_empty_and_creates_nothing(self) -> None:
        resp = self.get(session_key())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])
        self.assertEqual(Conversation.objects.count(), 0)

    def test_lists_only_that_sessions_messages(self) -> None:
        conv = ConversationFactory()
        other = ConversationFactory()
        m1 = MessageFactory(conversation=conv)
        m2 = MessageFactory(conversation=conv)
        MessageFactory(conversation=other)

        resp = self.get(conv.session)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual([item["id"] for item in resp.json()], [m1.id, m2.id])

    # REMOTE_ADDR is the visitor, as locally with no proxy; CI runs with DEBUG off, where the header is required.
    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_is_rate_limited_per_ip(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_history": "2/min"}):
            for _ in range(2):
                self.assertEqual(self.get(session_key()).status_code, 200)
            resp = self.get(session_key())
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})

    def test_is_rate_limited_per_session_across_ips(self) -> None:
        session = session_key()
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_history_session": "2/min"}):
            for ip in ("10.0.0.1", "10.0.0.2"):
                self.assertEqual(self.get(session, REMOTE_ADDR=ip).status_code, 200)
            resp = self.get(session, REMOTE_ADDR="10.0.0.3")
        self.assertEqual(resp.status_code, 429)

    @override_settings(TRUSTED_CLIENT_IP_HEADER="X-Real-IP")
    def test_client_ip_comes_from_the_proxy_header_only(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_history": "1/min"}):
            first = self.client.get(
                self.url, headers={"X-Vex-Session": session_key(), "X-Real-IP": "1.1.1.1", "X-Forwarded-For": "a"}
            )
            # A forged X-Forwarded-For does not make a new visitor...
            spoofed = self.client.get(
                self.url, headers={"X-Vex-Session": session_key(), "X-Real-IP": "1.1.1.1", "X-Forwarded-For": "b"}
            )
            # ...while a different address from the edge does.
            other = self.client.get(self.url, headers={"X-Vex-Session": session_key(), "X-Real-IP": "2.2.2.2"})
        self.assertEqual([first.status_code, spoofed.status_code, other.status_code], [200, 429, 200])


class ClientIpTestCase(TestCase):
    """Which address the per-IP limits count, with and without a proxy in front."""

    url = reverse("vex:chat")

    def setUp(self) -> None:
        cache.clear()
        warn_missing_ip_header.cache_clear()

    def post(self, **extra):
        return self.client.post(self.url, data={"question": "Hi"}, **extra)

    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_without_a_proxy_header_the_socket_address_is_the_visitor(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_chat": "1/min", "vex_chat_session": "10/min"}):
            first = self.post(REMOTE_ADDR="10.0.0.1")
            again = self.post(REMOTE_ADDR="10.0.0.1")
            other = self.post(REMOTE_ADDR="10.0.0.2")
        self.assertEqual([first.status_code, again.status_code, other.status_code], [200, 429, 200])

    @override_settings(TRUSTED_CLIENT_IP_HEADER="X-Real-IP")
    def test_a_missing_proxy_header_skips_the_ip_limit_and_warns_once(self) -> None:
        # REMOTE_ADDR is the proxy here: counting it would put every visitor in one bucket.
        with (
            patch.dict(VexThrottle.THROTTLE_RATES, {"vex_chat": "1/min", "vex_chat_daily": "1/day"}),
            self.assertLogs("vex.api.limits", level="WARNING") as logs,
        ):
            statuses = [self.post(REMOTE_ADDR="10.0.0.1").status_code for _ in range(3)]
        self.assertEqual(statuses, [200, 200, 200])
        self.assertEqual(len(logs.records), 1)
        self.assertIn("X-Real-IP", logs.output[0])

    @override_settings(TRUSTED_CLIENT_IP_HEADER="X-Real-IP")
    def test_a_missing_proxy_header_keeps_the_session_limit(self) -> None:
        data = {"question": "Hi", "session_key": session_key()}
        with (
            patch.dict(VexThrottle.THROTTLE_RATES, {"vex_chat_session": "1/min"}),
            self.assertLogs("vex.api.limits", level="WARNING"),
        ):
            first = self.client.post(self.url, data=data)
            again = self.client.post(self.url, data=data)
        self.assertEqual([first.status_code, again.status_code], [200, 429])


class MessageFeedbackViewTestCase(TestCase):
    def setUp(self) -> None:
        cache.clear()
        self.answer = MessageFactory(role=Roles.ASSISTANT)
        self.session = self.answer.conversation.session

    def rate(self, message: Message, body: object, session: str | None = None, **extra):
        url = reverse("vex:feedback", kwargs={"pk": message.pk})
        session = self.session if session is None else session
        headers = {"X-Vex-Session": session} if session else {}
        return self.client.post(url, data=body, content_type="application/json", headers=headers, **extra)

    def stored(self) -> str:
        self.answer.refresh_from_db()
        return self.answer.feedback

    def test_rates_an_answer_changes_it_and_takes_it_back(self) -> None:
        for value, stored in (("up", Feedback.UP), ("down", Feedback.DOWN), (None, "")):
            with self.subTest(value=value):
                resp = self.rate(self.answer, {"value": value})
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(resp.json(), {"id": self.answer.pk, "feedback": value})
                self.assertEqual(self.stored(), stored)

    def test_the_history_carries_the_rating(self) -> None:
        unrated = MessageFactory(conversation=self.answer.conversation, role=Roles.ASSISTANT)
        self.rate(self.answer, {"value": "down"})
        resp = self.client.get(reverse("vex:messages"), headers={"X-Vex-Session": self.session})
        ratings = {item["id"]: item["feedback"] for item in resp.json()}
        self.assertEqual(ratings, {self.answer.pk: "down", unrated.pk: None})

    def test_another_conversation_cannot_rate_it(self) -> None:
        other = ConversationFactory()
        resp = self.rate(self.answer, {"value": "up"}, session=other.session)
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(self.stored(), "")

    def test_only_answers_can_be_rated(self) -> None:
        question = MessageFactory(conversation=self.answer.conversation, role=Roles.USER)
        self.assertEqual(self.rate(question, {"value": "up"}).status_code, 404)
        question.refresh_from_db()
        self.assertEqual(question.feedback, "")

    def test_an_unknown_message_is_not_found(self) -> None:
        missing = Message(pk=self.answer.pk + 1000)
        self.assertEqual(self.rate(missing, {"value": "up"}).status_code, 404)

    def test_requires_a_well_formed_session(self) -> None:
        for session, code in (("", "session_required"), ("not a session key", "invalid_session")):
            with self.subTest(session=session):
                resp = self.rate(self.answer, {"value": "up"}, session=session)
                self.assertEqual(resp.status_code, 400)
                self.assertEqual(resp.json(), {"code": code})
        self.assertEqual(self.stored(), "")

    def test_rejects_anything_but_up_down_or_null(self) -> None:
        for body in ({"value": "sideways"}, {"value": 1}, {"value": ["up"]}, {}, ["up"], '"up"'):
            with self.subTest(body=body):
                resp = self.rate(self.answer, body)
                self.assertEqual(resp.status_code, 400)
                self.assertEqual(resp.json(), {"code": "invalid_feedback"})
        self.assertEqual(self.stored(), "")

    def test_only_post_is_allowed(self) -> None:
        url = reverse("vex:feedback", kwargs={"pk": self.answer.pk})
        self.assertEqual(self.client.get(url, headers={"X-Vex-Session": self.session}).status_code, 405)

    # REMOTE_ADDR is the visitor, as locally with no proxy; CI runs with DEBUG off, where the header is required.
    @override_settings(TRUSTED_CLIENT_IP_HEADER="")
    def test_is_rate_limited_per_ip(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_feedback": "2/min"}):
            for _ in range(2):
                self.assertEqual(self.rate(self.answer, {"value": "up"}).status_code, 200)
            resp = self.rate(self.answer, {"value": "down"})
        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"code": "rate_limited"})
        self.assertEqual(self.stored(), Feedback.UP)

    def test_is_rate_limited_per_session_across_ips(self) -> None:
        with patch.dict(VexThrottle.THROTTLE_RATES, {"vex_feedback_session": "2/min"}):
            for ip in ("10.0.0.1", "10.0.0.2"):
                self.assertEqual(self.rate(self.answer, {"value": "up"}, REMOTE_ADDR=ip).status_code, 200)
            resp = self.rate(self.answer, {"value": "up"}, REMOTE_ADDR="10.0.0.3")
        self.assertEqual(resp.status_code, 429)
