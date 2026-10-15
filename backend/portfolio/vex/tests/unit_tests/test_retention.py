from datetime import datetime, timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.db import DatabaseError
from django.test import TestCase, override_settings
from django.utils import timezone

from vex import retention
from vex.choices import Roles
from vex.models import Conversation, Message, Usage
from vex.tests.factories import ConversationFactory, MessageFactory
from vex.tests.unit_tests.test_ai.test_spend import REDIS_DOWN, usage_row
from vex.tests.unit_tests.test_api.test_sse import StreamViewTestCase, session_key
from vex.utils.cache import breaker, cache

NOW = timezone.now()
DAY = timedelta(days=1)


def conversation(created: datetime, *messages: datetime) -> Conversation:
    """A conversation created at `created`, with a message created at each of `messages`."""
    row = ConversationFactory()
    Conversation.objects.filter(pk=row.pk).update(created_at=created, updated_at=created)
    for at in messages:
        message = MessageFactory(conversation=row)
        Message.objects.filter(pk=message.pk).update(created_at=at, updated_at=at)
    return row


@override_settings(VEX_CONVERSATION_RETENTION_DAYS=730)
class PurgeTestCase(TestCase):
    def test_deletes_only_conversations_with_no_message_since_the_cutoff(self) -> None:
        cutoff = NOW - 730 * DAY
        stale = conversation(cutoff - 30 * DAY, cutoff - 20 * DAY, cutoff - DAY)
        stale_and_empty = conversation(cutoff - DAY)
        # Started long ago, but written to since: its updated_at never moved, so it is the messages that keep it.
        revived = conversation(cutoff - 30 * DAY, cutoff - 20 * DAY, cutoff + DAY)
        recent_and_empty = conversation(cutoff + DAY)

        self.assertEqual(retention.purge_stale_conversations(now=NOW), 2)

        self.assertEqual(set(Conversation.objects.values_list("pk", flat=True)), {revived.pk, recent_and_empty.pk})
        self.assertFalse(Message.objects.filter(conversation__in=[stale.pk, stale_and_empty.pk]).exists())
        self.assertEqual(Message.objects.filter(conversation=revived).count(), 2)

    def test_keeps_what_the_calls_cost_unlinked(self) -> None:
        stale = conversation(NOW - 800 * DAY, NOW - 800 * DAY)
        cost = usage_row("0.00010000", conversation=stale)

        retention.purge_stale_conversations(now=NOW)

        cost.refresh_from_db()
        self.assertIsNone(cost.conversation)
        self.assertEqual(Usage.objects.count(), 1)

    @override_settings(VEX_CONVERSATION_RETENTION_DAYS=30)
    def test_the_period_is_the_setting(self) -> None:
        conversation(NOW - 31 * DAY, NOW - 31 * DAY)
        kept = conversation(NOW - 29 * DAY, NOW - 29 * DAY)

        self.assertEqual(retention.purge_stale_conversations(now=NOW), 1)
        self.assertEqual(list(Conversation.objects.values_list("pk", flat=True)), [kept.pk])

    def test_the_command_purges_and_says_how_many(self) -> None:
        conversation(NOW - 800 * DAY, NOW - 800 * DAY)
        out = StringIO()

        call_command("vex_purge", stdout=out)

        self.assertFalse(Conversation.objects.exists())
        self.assertEqual(out.getvalue().strip(), "Deleted 1 conversations with no message in 730 days")


PURGE = "vex.retention.purge_stale_conversations"


class PurgeDailyTestCase(TestCase):
    def setUp(self) -> None:
        cache.clear()

    def test_runs_once_a_day(self) -> None:
        with patch(PURGE, return_value=0) as purge:
            retention.purge_daily()
            retention.purge_daily()
            self.assertEqual(purge.call_count, 1)

            cache.delete(retention.PURGE_KEY)  # as the key's day runs out
            retention.purge_daily()
            self.assertEqual(purge.call_count, 2)

    def test_a_failure_is_logged_not_raised(self) -> None:
        with patch(PURGE, side_effect=DatabaseError("boom")), self.assertLogs("vex.retention", "ERROR") as logs:
            retention.purge_daily()
        self.assertIn("purge failed", logs.output[0])

    @override_settings(CACHES=REDIS_DOWN)
    def test_nothing_runs_while_redis_is_down(self) -> None:
        self.addCleanup(breaker.reset)
        with patch(PURGE) as purge, self.assertLogs("vex.utils.cache", "ERROR"):
            retention.purge_daily()
        purge.assert_not_called()


class PurgeOnAnswerTestCase(StreamViewTestCase):
    def test_the_days_first_answer_purges(self) -> None:
        stale = conversation(NOW - 800 * DAY, NOW - 800 * DAY)

        events, _ = self.stream(["Hi"], session_key())

        self.assertEqual(events[-1][0], "done")
        self.assertFalse(Conversation.objects.filter(pk=stale.pk).exists())

    def test_a_purge_that_fails_still_answers(self) -> None:
        session = session_key()
        with patch(PURGE, side_effect=DatabaseError("boom")), self.assertLogs("vex.retention", "ERROR"):
            events, _ = self.stream(["Hi"], session)

        answer = Message.objects.get(conversation__session=session, role=Roles.ASSISTANT)
        self.assertEqual(events[-1], ("done", {"message_id": answer.pk, "truncated": False}))
