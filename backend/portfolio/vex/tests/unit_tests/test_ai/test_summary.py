from datetime import timedelta
from decimal import Decimal
from typing import Any
from unittest.mock import patch

import anthropic
import httpx2
from django.db import DatabaseError
from django.test import TestCase, override_settings
from django.utils import timezone

from vex.ai import provider, spend
from vex.ai.summary import (
    MAX_TOKENS,
    SUMMARY_PROMPT_VERSION,
    SYSTEM,
    Unsummarised,
    estimate_tokens,
    summarise,
    to_summarise,
    transcript,
)
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
        self.assertIsNotNone(saved.summary_attempted_at)
        self.assertEqual(saved.updated_at, updated_at)  # retention reads it as the visitor's last activity
        usage = Usage.objects.get()
        self.assertEqual((usage.purpose, usage.outcome), (Purposes.SUMMARY, Outcomes.ANSWERED))
        self.assertEqual(usage.prompt_version, SUMMARY_PROMPT_VERSION)
        self.assertEqual(usage.conversation, self.conversation)
        self.assertGreater(usage.cost, Decimal(0))

    def test_the_attempt_is_timed_even_when_saving_the_summary_fails(self) -> None:
        real = Conversation.objects.filter
        calls = []

        def filter_then_fail(*args: Any, **kwargs: Any) -> Any:
            calls.append(kwargs)
            if len(calls) == 2:  # the second write is the summary's own
                raise DatabaseError("lost the connection")
            return real(*args, **kwargs)

        with (
            patch("vex.ai.summary.provider.complete", replying("Recruiter asking about Django roles")),
            patch("vex.ai.summary.Conversation.objects.filter", side_effect=filter_then_fail),
            self.assertRaises(DatabaseError),
        ):
            summarise(self.conversation)
        self.assertIsNotNone(Conversation.objects.get(pk=self.conversation.pk).summary_attempted_at)

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
                self.assertIsNotNone(saved.summary_attempted_at)  # tried, so it waits behind the others next time
                self.assertEqual(saved.updated_at, self.conversation.updated_at)
                self.assertEqual(Usage.objects.get().outcome, outcome)

    def test_an_error_nobody_foresaw_is_recorded_marked_and_raised(self) -> None:
        with patch("vex.ai.summary.provider.complete", side_effect=AttributeError("odd reply")):
            with self.assertRaises(AttributeError):
                summarise(self.conversation)
        self.assertTrue(Conversation.objects.get(pk=self.conversation.pk).summary_failed)
        self.assertEqual(Usage.objects.get().outcome, Outcomes.FAILED)

    def test_a_refused_connection_costs_nothing(self) -> None:
        error = anthropic.APIConnectionError(request=REQUEST)
        with patch("vex.ai.summary.provider.complete", side_effect=error), self.assertRaises(Unsummarised):
            summarise(self.conversation)
        usage = Usage.objects.get()
        self.assertEqual((usage.input_tokens, usage.output_tokens, usage.cost), (0, 0, Decimal(0)))

    @override_settings(VEX_MODEL="claude-opus-5-5", VEX_PRICES={"claude-opus-5-5": (4.00, 0.20, 5.00, 20.00)})
    def test_a_call_that_timed_out_is_counted_whole_on_every_attempt(self) -> None:
        # Sent, and maybe billed, once for each attempt the client made; nothing was reported, so all is estimated.
        MessageFactory(conversation=self.conversation, role=Roles.USER, content="A long question. " * 3000)
        error = anthropic.APITimeoutError(request=REQUEST)
        with patch("vex.ai.summary.provider.complete", side_effect=error), self.assertRaises(Unsummarised):
            summarise(self.conversation)
        usage = Usage.objects.get()
        attempts = provider.MAX_RETRIES + 1
        prompt = estimate_tokens(SYSTEM + transcript(self.conversation))
        self.assertGreater(prompt, 15_000)  # chars / 3 for ~51k characters
        self.assertTrue(usage.estimated)
        self.assertEqual((usage.input_tokens, usage.output_tokens), (prompt * attempts, MAX_TOKENS * attempts))
        self.assertEqual(usage.cost, (Decimal(prompt) * 4 + MAX_TOKENS * 20) * attempts / 1_000_000)


class ToSummariseTestCase(TestCase):
    def test_behind_first_then_untried_then_the_longest_ago(self) -> None:
        now = timezone.now()
        fields = {
            "untried": {},
            "failed": {"summary_failed": True, "summary_attempted_at": now - timedelta(minutes=1)},
            "behind": {"summary": "Old", "summarised_messages": 1, "summary_attempted_at": now},
            "current, long ago": {
                "summary": "S",
                "summarised_messages": 2,
                "summary_attempted_at": now - timedelta(days=1),
            },
            "current, recent": {"summary": "S", "summarised_messages": 2, "summary_attempted_at": now},
        }
        made = {}
        for name, values in fields.items():
            made[name] = ConversationFactory()
            MessageFactory.create_batch(2, conversation=made[name])
            Conversation.objects.filter(pk=made[name].pk).update(**values)
        ConversationFactory()  # no messages
        order = list(to_summarise(Conversation.objects.all()))
        self.assertEqual(order, [made[name] for name in fields])
        self.assertEqual([c.behind for c in order], [True, True, True, False, False])
