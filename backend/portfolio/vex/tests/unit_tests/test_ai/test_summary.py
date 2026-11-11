from decimal import Decimal
from typing import Any
from unittest.mock import patch

import anthropic
import httpx2
from django.test import TestCase

from vex.ai import provider, spend
from vex.ai.summary import SUMMARY_PROMPT_VERSION, Unsummarised, needing_summary, summarise, transcript
from vex.choices import Outcomes, Purposes, Roles
from vex.models import Conversation, Usage
from vex.tests.factories import ConversationFactory, MessageFactory


def replying(text: str, finish_reason: str = "end_turn") -> Any:
    """A stand-in for provider.complete that bills a small call and returns `text`."""

    def complete(_system: str, _prompt: str, *, usage: provider.Usage, **_options: int) -> str:
        usage.model, usage.input_tokens, usage.output_tokens, usage.reported = "claude-opus-5-5", 400, 20, True
        usage.finish_reason = finish_reason
        return text

    return complete


REQUEST = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")


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
        self.assertEqual((saved.summary, saved.summarised_messages, saved.summary_failed), (summary, 2, False))
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

    def test_a_failed_attempt_saves_no_summary_marks_it_and_records_the_call(self) -> None:
        for name, reply, outcome in (
            ("declined", {"side_effect": provider.Refused("declined")}, Outcomes.FAILED),
            ("empty", {"side_effect": replying("  ")}, Outcomes.EMPTY),
            ("cut off", {"side_effect": replying("Recruiter asking about", "max_tokens")}, Outcomes.FAILED),
            ("failed", {"side_effect": anthropic.APIConnectionError(request=REQUEST)}, Outcomes.FAILED),
        ):
            with self.subTest(name):
                Usage.objects.all().delete()
                Conversation.objects.filter(pk=self.conversation.pk).update(summary_failed=False)
                with patch("vex.ai.summary.provider.complete", **reply), self.assertRaises(Unsummarised):
                    summarise(self.conversation)
                saved = Conversation.objects.get(pk=self.conversation.pk)
                self.assertEqual((saved.summary, saved.summary_failed), ("", True))
                self.assertEqual(Usage.objects.get().outcome, outcome)

    def test_a_call_that_timed_out_is_counted_at_the_most_it_can_cost(self) -> None:
        # A refused connection was never billed; a request that timed out may have been, and is counted high.
        for error, billed in (
            (anthropic.APIConnectionError(request=REQUEST), False),
            (anthropic.APITimeoutError(request=REQUEST), True),
        ):
            with self.subTest(type(error).__name__):
                Usage.objects.all().delete()
                with patch("vex.ai.summary.provider.complete", side_effect=error), self.assertRaises(Unsummarised):
                    summarise(self.conversation)
                usage = Usage.objects.get()
                self.assertEqual(usage.output_tokens > 0, billed)
                self.assertEqual(usage.cost > 0, billed)


class NeedingSummaryTestCase(TestCase):
    def test_skips_empty_and_up_to_date_conversations(self) -> None:
        unsummarised, behind, current = ConversationFactory(), ConversationFactory(), ConversationFactory()
        ConversationFactory()  # no messages
        for conversation in (unsummarised, behind, current):
            MessageFactory.create_batch(2, conversation=conversation)
        Conversation.objects.filter(pk=behind.pk).update(summary="Old", summarised_messages=1)
        Conversation.objects.filter(pk=current.pk).update(summary="Current", summarised_messages=2)
        self.assertCountEqual(needing_summary(Conversation.objects.all()), [unsummarised, behind])

    def test_those_that_failed_last_time_come_last(self) -> None:
        failed, untried = ConversationFactory(), ConversationFactory()
        for conversation in (failed, untried):
            MessageFactory(conversation=conversation)
        Conversation.objects.filter(pk=failed.pk).update(summary_failed=True)
        self.assertEqual(list(needing_summary(Conversation.objects.all())), [untried, failed])
