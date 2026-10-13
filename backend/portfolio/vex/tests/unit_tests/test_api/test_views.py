from unittest.mock import patch

import faker
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse

from vex.api.limits import QUESTION_MAX_LENGTH, VexThrottle
from vex.models import Conversation
from vex.tests.factories import ConversationFactory, MessageFactory

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
        self.assertEqual(resp.json()["error"], "Empty question")

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
