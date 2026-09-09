import faker
from django.test import TestCase
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from vex.ai.history import MessageHistory
from vex.choices import Roles
from vex.tests.factories import ConversationFactory, MessageFactory

fake = faker.Faker()


class MessageHistoryTestCase(TestCase):
    def test_messages_empty_for_new_session(self) -> None:
        session = fake.uuid4()
        history = MessageHistory(session)
        self.assertEqual(history.messages, [])

    def test_add_message_persists_with_correct_roles(self) -> None:
        session = fake.uuid4()
        history = MessageHistory(session)

        history.add_message(HumanMessage(content="Hi"))
        history.add_message(AIMessage(content="Hello"))
        history.add_message(SystemMessage(content="Note"))

        # Reload via factory-backed queryset for assertions
        conv = history.conversation

        msgs = list(conv.messages.order_by("created_at"))
        self.assertEqual(len(msgs), 3)
        self.assertEqual([m.role for m in msgs], [Roles.USER, Roles.ASSISTANT, Roles.SYSTEM])
        self.assertEqual([m.content for m in msgs], ["Hi", "Hello", "Note"])

    def test_messages_property_returns_langchain_messages_in_order(self) -> None:
        session = fake.uuid4()
        conv = ConversationFactory(session=session)
        # Create in order
        m1 = MessageFactory(conversation=conv, role=Roles.USER, content="Q1")
        m2 = MessageFactory(conversation=conv, role=Roles.ASSISTANT, content="A1")
        m3 = MessageFactory(conversation=conv, role=Roles.SYSTEM, content="Sys")

        history = MessageHistory(session)
        msgs = history.messages

        # Types map correctly
        self.assertEqual([type(x).__name__ for x in msgs], ["HumanMessage", "AIMessage", "SystemMessage"])
        self.assertEqual([x.content for x in msgs], [m1.content, m2.content, m3.content])

    def test_clear_deletes_all_messages(self) -> None:
        session = fake.uuid4()
        conv = ConversationFactory(session=session)
        MessageFactory(conversation=conv)
        MessageFactory(conversation=conv)

        history = MessageHistory(session)
        self.assertGreater(conv.messages.count(), 0)
        history.clear()
        self.assertEqual(conv.messages.count(), 0)
