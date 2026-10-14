import faker
from django.test import TestCase, override_settings

from vex.ai.history import MessageHistory, Turn
from vex.ai.provider import Usage
from vex.choices import Roles
from vex.models import Conversation
from vex.tests.factories import ConversationFactory, MessageFactory

fake = faker.Faker()


def session_key() -> str:
    return fake.uuid4().replace("-", "")


class MessageHistoryTestCase(TestCase):
    def test_rejects_a_key_this_server_never_issued(self) -> None:
        with self.assertRaises(ValueError):
            MessageHistory("anything-at-all")
        self.assertFalse(Conversation.objects.exists())

    def test_a_new_conversation_has_no_history(self) -> None:
        self.assertEqual(MessageHistory(session_key()).recent(), [])

    def test_recent_gives_questions_and_answers_oldest_first_without_system_notes(self) -> None:
        conversation = ConversationFactory()
        MessageFactory(conversation=conversation, role=Roles.USER, content="Q1")
        MessageFactory(conversation=conversation, role=Roles.SYSTEM, content="Note")
        MessageFactory(conversation=conversation, role=Roles.ASSISTANT, content="A1")
        self.assertEqual(MessageHistory(conversation.session).recent(), [Turn("user", "Q1"), Turn("assistant", "A1")])

    def test_recent_keeps_only_the_latest_messages(self) -> None:
        conversation = ConversationFactory()
        for i in range(12):
            MessageFactory(conversation=conversation, role=Roles.USER, content=f"Q{i}")
        turns = MessageHistory(conversation.session).recent(limit=8)
        self.assertEqual([turn.content for turn in turns], [f"Q{i}" for i in range(4, 12)])

    def test_recent_stays_within_its_token_budget_but_always_keeps_the_newest(self) -> None:
        conversation = ConversationFactory()
        MessageFactory(conversation=conversation, role=Roles.USER, content="old " * 100)
        MessageFactory(conversation=conversation, role=Roles.ASSISTANT, content="new " * 100)
        history = MessageHistory(conversation.session)
        self.assertEqual([turn.role for turn in history.recent(budget=150)], ["assistant"])
        self.assertEqual([turn.role for turn in history.recent(budget=10)], ["assistant"])
        self.assertEqual(len(history.recent(budget=200)), 2)

    @override_settings(VEX_MODEL="gpt-6.1-sol")
    def test_add_exchange_saves_the_question_and_the_answer_with_its_cost(self) -> None:
        history = MessageHistory(session_key())
        usage = Usage(input_tokens=40000, cached_tokens=39000, output_tokens=120, reasoning_tokens=20)
        saved = history.add_exchange(Turn("user", "Hi"), "Hello", usage=usage, prompt_version="v1")
        question, answer = history.conversation.messages.order_by("created_at", "pk")
        self.assertEqual(saved, answer)
        self.assertEqual((question.role, question.content, question.model), (Roles.USER, "Hi", ""))
        self.assertIsNone(question.input_tokens)
        self.assertEqual(
            (answer.role, answer.content, answer.model, answer.prompt_version),
            (Roles.ASSISTANT, "Hello", "gpt-6.1-sol", "v1"),
        )
        self.assertEqual((answer.input_tokens, answer.cached_tokens, answer.output_tokens), (40000, 39000, 120))

    def test_where_a_question_was_asked_is_saved_with_it_and_read_back(self) -> None:
        history = MessageHistory(session_key())
        history.add_exchange(Turn("user", "Q1", "From the role X."), "A1", usage=Usage(), prompt_version="v1")
        history.add_exchange(Turn("user", "Q2"), "A2", usage=Usage(), prompt_version="v1")
        self.assertEqual(
            history.recent(),
            [
                Turn("user", "Q1", "From the role X."),
                Turn("assistant", "A1"),
                Turn("user", "Q2"),
                Turn("assistant", "A2"),
            ],
        )
