import faker
from django.test import TestCase
from django.urls import reverse

from vex.tests.factories import ConversationFactory, MessageFactory

fake = faker.Faker()


class ChatViewTestCase(TestCase):
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
        self.assertTrue(body["session_key"])  # non-empty

    def test_post_honors_existing_session(self) -> None:
        # simulate client-provided session
        session = fake.uuid4()
        url = reverse("vex:chat")
        resp = self.client.post(url, data={"question": "Hi", "session_key": session})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["session_key"], session)


class MessageListViewTestCase(TestCase):
    def test_list_messages_empty(self) -> None:
        url = reverse("vex:messages")
        resp = self.client.get(url, data={"session": fake.uuid4()})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_list_messages_by_session(self) -> None:
        conv = ConversationFactory(session=fake.uuid4())
        other = ConversationFactory(session=fake.uuid4())

        m1 = MessageFactory(conversation=conv)
        m2 = MessageFactory(conversation=conv)
        MessageFactory(conversation=other)

        url = reverse("vex:messages")
        resp = self.client.get(url, data={"session": conv.session, "ordering": "created_at"})
        self.assertEqual(resp.status_code, 200)

        data = resp.json()
        self.assertEqual(len(data), 2)
        self.assertEqual({item["id"] for item in data}, {m1.id, m2.id})
