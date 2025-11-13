import faker
from django.test import TestCase

from vex.choices import Roles
from vex.models import Conversation, Document, Message

fake = faker.Faker()


class VexModelsTestCase(TestCase):
    # -------------------------
    # Conversation
    # -------------------------
    def test_create_conversation_success(self) -> None:
        session = fake.uuid4()
        obj = Conversation.objects.create(session=session)

        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(obj.session, session)
        self.assertIn(session, str(obj))

    # -------------------------
    # Message
    # -------------------------
    def test_create_message_success(self) -> None:
        conv = Conversation.objects.create(session=fake.uuid4())
        msg = Message.objects.create(conversation=conv, role=Roles.USER, content="Hello!")

        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(msg.conversation, conv)
        self.assertEqual(msg.role, Roles.USER)
        self.assertEqual(msg.content, "Hello!")

    def test_message_role_choices(self) -> None:
        conv = Conversation.objects.create(session=fake.uuid4())
        Message.objects.create(conversation=conv, role=Roles.ASSISTANT, content="Hi!")
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(Message.objects.first().role, Roles.ASSISTANT)

    # -------------------------
    # Document
    # -------------------------
    def test_create_document_minimal(self) -> None:
        doc = Document.objects.create(title="Specs")
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(doc.title, "Specs")
        self.assertIsNone(doc.description)
        self.assertIsNone(doc.url)
        self.assertFalse(bool(doc.file))
        self.assertFalse(doc.injected)
        self.assertIn("Document:", str(doc))

    def test_document_optional_fields(self) -> None:
        doc = Document.objects.create(title="Paper", description="Math paper", url="https://example.com/p.pdf")
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(doc.description, "Math paper")
        self.assertEqual(doc.url, "https://example.com/p.pdf")

    def test_document_mark_as_injected(self) -> None:
        doc = Document.objects.create(title="Guide")
        self.assertFalse(doc.injected)
        doc.mark_as_injected()
        doc.refresh_from_db()
        self.assertTrue(doc.injected)
