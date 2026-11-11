from decimal import Decimal
from typing import Any
from unittest.mock import patch

from django.test import TestCase

from vex.ai import provider, spend
from vex.ai.summary import SUMMARY_PROMPT_VERSION, Unsummarised, needing_summary, summarise, transcript
from vex.choices import Outcomes, Purposes, Roles
from vex.models import Conversation, Usage
from vex.tests.factories import ConversationFactory, MessageFactory


def replying(text: str) -> Any:
    """A stand-in for provider.complete that bills a small call and returns `text`."""

    def complete(_system: str, _prompt: str, *, usage: provider.Usage, **_options: int) -> str:
        usage.model, usage.input_tokens, usage.output_tokens, usage.reported = "claude-opus-5-5", 400, 20, True
        usage.finish_reason = "end_turn"
        return text

    return complete


class SummariseTestCase(TestCase):
    def setUp(self) -> None:
        self.conversation = ConversationFactory()
        MessageFactory(conversation=self.conversation, role=Roles.USER, content="Is Dawid open to Django roles?")
        MessageFactory(conversation=self.conversation, role=Roles.ASSISTANT, content="He is!")
        patcher = patch("vex.ai.summary.spend.check_budget")
        self.check_budget = patcher.start()
        self.addCleanup(patcher.stop)

    def test_the_transcript_names_each_speaker_inside_tags(self) -> None:
        self.assertEqual(
            transcript(self.conversation),
            "<conversation>\nVisitor: Is Dawid open to Django roles?\n\nVex: He is!\n</conversation>",
        )

    def test_writes_one_line_and_the_messages_it_covers_and_records_the_call(self) -> None:
        updated_at = self.conversation.updated_at
        with patch("vex.ai.summary.provider.complete", replying("  Recruiter asking about\nDjango roles ")):
            summary = summarise(self.conversation)
        self.assertEqual(summary, "Recruiter asking about Django roles")
        saved = Conversation.objects.get(pk=self.conversation.pk)
        self.assertEqual((saved.summary, saved.summarised_messages), (summary, 2))
        self.assertEqual(saved.updated_at, updated_at)  # retention reads it as the visitor's last activity
        usage = Usage.objects.get()
        self.assertEqual((usage.purpose, usage.outcome), (Purposes.SUMMARY, Outcomes.ANSWERED))
        self.assertEqual(usage.prompt_version, SUMMARY_PROMPT_VERSION)
        self.assertEqual(usage.conversation, self.conversation)
        self.assertGreater(usage.cost, Decimal(0))

    def test_a_long_reply_is_cut_to_the_field(self) -> None:
        with patch("vex.ai.summary.provider.complete", replying("word " * 100)):
            summary = summarise(self.conversation)
        self.assertEqual(len(summary), 200)
        self.assertTrue(summary.endswith("…"))

    def test_nothing_is_called_once_the_budget_is_spent(self) -> None:
        self.check_budget.side_effect = spend.Resting("spent")
        with patch("vex.ai.summary.provider.complete") as complete, self.assertRaises(spend.Resting):
            summarise(self.conversation)
        complete.assert_not_called()
        self.assertFalse(Usage.objects.exists())

    def test_a_decline_or_an_empty_reply_saves_no_summary_but_records_the_call(self) -> None:
        for reply, outcome in (
            ({"side_effect": provider.Refused("declined")}, Outcomes.FAILED),
            ({"side_effect": replying("  ")}, Outcomes.EMPTY),
        ):
            with self.subTest(outcome=outcome):
                Usage.objects.all().delete()
                with patch("vex.ai.summary.provider.complete", **reply), self.assertRaises(Unsummarised):
                    summarise(self.conversation)
                self.assertEqual(Conversation.objects.get(pk=self.conversation.pk).summary, "")
                self.assertEqual(Usage.objects.get().outcome, outcome)


class NeedingSummaryTestCase(TestCase):
    def test_skips_empty_and_up_to_date_conversations(self) -> None:
        unsummarised, behind, current = ConversationFactory(), ConversationFactory(), ConversationFactory()
        ConversationFactory()  # no messages
        for conversation in (unsummarised, behind, current):
            MessageFactory.create_batch(2, conversation=conversation)
        Conversation.objects.filter(pk=behind.pk).update(summary="Old", summarised_messages=1)
        Conversation.objects.filter(pk=current.pk).update(summary="Current", summarised_messages=2)
        self.assertCountEqual(needing_summary(Conversation.objects.all()), [unsummarised, behind])
