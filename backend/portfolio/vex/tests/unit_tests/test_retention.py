import importlib
import os
import subprocess  # nosec B404: one fixed command, the test's own interpreter
import sys
from datetime import datetime, timedelta
from io import StringIO
from unittest.mock import patch

from django.apps import apps
from django.conf import settings
from django.core.management import call_command
from django.db import DatabaseError
from django.test import SimpleTestCase, TestCase, override_settings
from django.utils import timezone

from vex import retention
from vex.ai.history import MessageHistory
from vex.choices import Roles
from vex.models import Conversation, Message, Usage
from vex.tests.factories import ConversationFactory, MessageFactory
from vex.tests.unit_tests.test_ai.test_spend import REDIS_DOWN, usage_row
from vex.tests.unit_tests.test_api.test_sse import STREAM, FakeModel, StreamViewTestCase, parse_events, session_key
from vex.utils.cache import breaker, cache

NOW = timezone.now()
DAY = timedelta(days=1)


def conversation(last_active: datetime, messages: int = 2, session: str | None = None) -> Conversation:
    """A conversation last touched at `last_active`, holding `messages` messages from then."""
    row = ConversationFactory(**({"session": session} if session else {}))
    for _ in range(messages):
        message = MessageFactory(conversation=row)
        Message.objects.filter(pk=message.pk).update(created_at=last_active, updated_at=last_active)
    Conversation.objects.filter(pk=row.pk).update(created_at=last_active, updated_at=last_active)
    return row


@override_settings(VEX_CONVERSATION_RETENTION_DAYS=730)
class PurgeTestCase(TestCase):
    def test_deletes_only_conversations_untouched_since_the_cutoff_with_their_messages(self) -> None:
        cutoff = NOW - 730 * DAY
        stale = conversation(cutoff - DAY)
        stale_and_empty = conversation(cutoff - DAY, messages=0)
        recent = conversation(cutoff + DAY)

        self.assertEqual(retention.purge_stale_conversations(now=NOW), 2)

        self.assertEqual(list(Conversation.objects.values_list("pk", flat=True)), [recent.pk])
        self.assertFalse(Message.objects.filter(conversation__in=[stale.pk, stale_and_empty.pk]).exists())
        self.assertEqual(Message.objects.filter(conversation=recent).count(), 2)

    def test_a_question_in_an_old_conversation_keeps_it(self) -> None:
        old = conversation(NOW - 800 * DAY)

        MessageHistory(old.session)

        old.refresh_from_db()
        self.assertGreater(old.updated_at, NOW)
        self.assertEqual(retention.purge_stale_conversations(), 0)

    def test_keeps_what_the_calls_cost_unlinked(self) -> None:
        stale = conversation(NOW - 800 * DAY)
        cost = usage_row("0.00010000", conversation=stale)

        retention.purge_stale_conversations(now=NOW)

        cost.refresh_from_db()
        self.assertIsNone(cost.conversation)
        self.assertEqual(Usage.objects.count(), 1)

    @override_settings(VEX_CONVERSATION_RETENTION_DAYS=30)
    def test_the_period_is_the_setting(self) -> None:
        conversation(NOW - 31 * DAY)
        kept = conversation(NOW - 29 * DAY)

        self.assertEqual(retention.purge_stale_conversations(now=NOW), 1)
        self.assertEqual(list(Conversation.objects.values_list("pk", flat=True)), [kept.pk])

    def test_the_command_purges_and_says_how_many(self) -> None:
        conversation(NOW - 800 * DAY)
        out = StringIO()

        call_command("vex_purge", stdout=out)

        self.assertFalse(Conversation.objects.exists())
        self.assertEqual(out.getvalue().strip(), "Deleted 1 conversations with no question in 730 days")

    def test_the_migration_dates_each_conversation_from_its_newest_message(self) -> None:
        # Before questions touched it, updated_at stayed at the conversation's creation.
        continued = conversation(NOW - 800 * DAY)
        newest = MessageFactory(conversation=continued)
        Message.objects.filter(pk=newest.pk).update(created_at=NOW - DAY)
        untouched = conversation(NOW - 800 * DAY)
        empty = conversation(NOW - 5 * DAY, messages=0)

        migration = importlib.import_module("vex.migrations.0016_conversation_last_activity")
        migration.backfill(apps, None)

        dates = dict(Conversation.objects.values_list("pk", "updated_at"))
        self.assertEqual(dates[continued.pk], NOW - DAY)
        self.assertEqual(dates[untouched.pk], NOW - 800 * DAY)
        self.assertEqual(dates[empty.pk], NOW - 5 * DAY)


class RetentionSettingTestCase(SimpleTestCase):
    def test_settings_refuse_a_period_under_a_day(self) -> None:
        # Zero would delete every conversation, the one just answered included.
        result = subprocess.run(  # nosec B603: a fixed argument list, no shell
            [sys.executable, "-c", "import django; django.setup()"],
            cwd=settings.BASE_DIR,
            env={
                **os.environ,
                "DJANGO_SETTINGS_MODULE": "portfolio.settings",
                "VEX_CONVERSATION_RETENTION_DAYS": "0",
            },
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ImproperlyConfigured: VEX_CONVERSATION_RETENTION_DAYS=0", result.stderr)


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
    def test_the_days_first_answer_purges_but_not_the_conversation_it_revived(self) -> None:
        stale = conversation(NOW - 800 * DAY)
        revived = conversation(NOW - 800 * DAY, session=session_key())

        events, _ = self.stream(["Hi"], revived.session)

        self.assertEqual(events[-1][0], "done")
        self.assertFalse(Conversation.objects.filter(pk=stale.pk).exists())
        self.assertEqual(Message.objects.filter(conversation=revived).count(), 4)

    def test_the_purge_waits_until_the_visitor_has_done(self) -> None:
        with patch(STREAM, FakeModel(["Hi"])), patch(PURGE, return_value=0) as purge:
            resp = self.post({"question": "Q"}, session_key())
            chunks = iter(resp.streaming_content)
            sent = ""
            while "event: done" not in sent:
                sent += next(chunks).decode("utf-8")
            purge.assert_not_called()
            sent += b"".join(chunks).decode("utf-8")
            purge.assert_called_once()
        self.assertEqual(parse_events(sent)[-1][0], "done")

    def test_a_purge_that_fails_still_answers(self) -> None:
        session = session_key()
        with patch(PURGE, side_effect=DatabaseError("boom")), self.assertLogs("vex.retention", "ERROR"):
            events, _ = self.stream(["Hi"], session)

        answer = Message.objects.get(conversation__session=session, role=Roles.ASSISTANT)
        self.assertEqual(events[-1], ("done", {"message_id": answer.pk, "truncated": False}))
