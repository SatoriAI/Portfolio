from datetime import UTC, datetime, timedelta
from decimal import Decimal
from io import StringIO
from types import SimpleNamespace
from typing import Any
from unittest.mock import patch

import fakeredis
import redis
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import caches
from django.core.management import call_command
from django.test import RequestFactory, TestCase, override_settings
from django.urls import reverse
from rest_framework.views import APIView

from vex.ai import spend
from vex.ai.engine import record_usage
from vex.ai.prompt import persona
from vex.ai.provider import Usage as ProviderUsage
from vex.api.limits import SESSION_HEADER, VexThrottle
from vex.choices import Outcomes
from vex.models import Usage
from vex.tests.factories import ConfigurationFactory, ConversationFactory
from vex.tests.unit_tests.test_api.test_sse import STREAM, FakeModel, parse_events, session_key
from vex.utils.cache import cache

PRICES = {"gpt-6-luna": (0.10, 0.01, 0.50)}
# Django's own Redis cache, talking to an in-process fake rather than a server.
FAKE_REDIS = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "vex": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://fake:6379/0",
        "KEY_PREFIX": "portfolio",
        "OPTIONS": {"connection_class": fakeredis.FakeConnection},
    },
}
# The same cache, aimed at a port nothing listens on: every call raises ConnectionError at once.
REDIS_DOWN = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "vex": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:1/0",
        "KEY_PREFIX": "portfolio",
        "OPTIONS": {"socket_connect_timeout": 0.5},
    },
}

CONNECT = redis.connection.Connection.connect


def usage_row(cost: str | None, *, created_at: datetime | None = None, **fields: Any) -> Usage:
    row = Usage.objects.create(
        model="gpt-6-luna",
        prompt_version="test",
        outcome=fields.pop("outcome", Outcomes.ANSWERED),
        input_tokens=fields.pop("input_tokens", 1000),
        cached_tokens=fields.pop("cached_tokens", 0),
        output_tokens=10,
        reasoning_tokens=0,
        estimated=fields.pop("estimated", False),
        cost=None if cost is None else Decimal(cost),
    )
    if created_at:
        Usage.objects.filter(pk=row.pk).update(created_at=created_at)
    return row


def record(usage: ProviderUsage, outcome: str = Outcomes.ANSWERED, answer: str = "An answer") -> None:
    record_usage(ConversationFactory(), usage, outcome, [{"role": "user", "content": "Q"}], answer)


@override_settings(VEX_MODEL="gpt-6-luna", VEX_PRICES=PRICES, VEX_DAILY_BUDGET_USD=Decimal("5.00"))
class SpendTestCase(TestCase):
    def setUp(self) -> None:
        cache.clear()
        spend._fallback.clear()  # pylint: disable=protected-access

    def counter(self) -> Any:
        return cache.get(spend.counter_key(spend.today()))

    def test_a_missing_counter_is_reseeded_from_the_table(self) -> None:
        usage_row("1.25")
        usage_row("0.00000001")
        usage_row(None)  # a model with no price
        usage_row("9.00", created_at=datetime.now(UTC) - timedelta(days=1))  # yesterday's
        self.assertIsNone(self.counter())
        self.assertEqual(spend.spent(spend.today()), Decimal("1.25000001"))
        self.assertEqual(self.counter(), 125000001)
        # From now on the counter answers, not the table.
        with self.assertNumQueries(0):
            self.assertEqual(spend.spent(spend.today()), Decimal("1.25000001"))

    def test_every_recorded_call_raises_the_counter(self) -> None:
        usage_row("0.10")
        spend.spent(spend.today())  # seeds the counter
        record(ProviderUsage(input_tokens=1000, cached_tokens=900, output_tokens=3, reported=True))
        self.assertEqual(self.counter(), 10002050)  # $0.10 + $0.0000205
        # An abandoned answer the provider never reported is estimated, and counts all the same.
        record(ProviderUsage(), Outcomes.ABANDONED, answer="Half of it")
        abandoned = Usage.objects.get(outcome=Outcomes.ABANDONED)
        self.assertTrue(abandoned.estimated)
        self.assertGreater(abandoned.cost, 0)
        self.assertEqual(spend.spent(spend.today()), Decimal("0.1000205") + abandoned.cost)
        self.assertEqual(spend.spent(spend.today()), spend.day_spend(spend.today()).dollars)

    def test_a_call_that_finds_no_counter_leaves_it_to_the_next_check(self) -> None:
        record(ProviderUsage(input_tokens=1000, cached_tokens=900, output_tokens=3, reported=True))
        self.assertIsNone(self.counter())
        self.assertEqual(spend.spent(spend.today()), Decimal("0.0000205"))
        self.assertEqual(self.counter(), 2050)

    def test_a_counter_seeded_at_zero_is_dropped_by_the_first_call(self) -> None:
        # Holding exactly the call just added is what a counter INCRBY recreated after it expired looks like (no
        # expiry, no earlier calls), so it is dropped and seeded from the table instead.
        spend.spent(spend.today())
        record(ProviderUsage(input_tokens=1000, cached_tokens=900, output_tokens=3, reported=True))
        self.assertIsNone(self.counter())
        self.assertEqual(spend.spent(spend.today()), Decimal("0.0000205"))

    def test_two_calls_written_before_any_counter_are_counted_once_each(self) -> None:
        # Two calls finish while there is no counter. When the first is counted, the table already holds both rows,
        # and the second's increment has not run yet. Seeding from the table there (as an increment once did) and
        # then letting the second increment land counted the second call twice.
        first, second = usage_row("0.25"), usage_row("0.50")
        spend.add(first.cost, spend.today())
        spend.add(second.cost, spend.today())
        self.assertEqual(spend.spent(spend.today()), Decimal("0.75"))

    def test_a_check_reading_an_old_total_never_overwrites_the_counter(self) -> None:
        # A check reads the table's total; before it stores it, another worker seeds the counter and a call raises
        # it. A plain SET would put the older total back over that call.
        usage_row("1.00")
        later = Decimal("0.50")

        def total_then_another_worker(day: Any) -> spend.DaySpend:
            totals = day_spend(day)
            cache.set(spend.counter_key(day), int((totals.dollars + later) / spend.UNIT), 60)
            return totals

        day_spend = spend.day_spend
        with patch.object(spend, "day_spend", total_then_another_worker):
            spend.spent(spend.today())
        self.assertEqual(spend.spent(spend.today()), Decimal("1.50"))

    def test_the_budget_is_checked_against_the_day_so_far(self) -> None:
        usage_row("4.99")
        spend.check_budget()
        usage_row("0.01")
        cache.clear()  # as a Redis restart would
        with self.assertRaisesMessage(spend.Resting, "reached VEX_DAILY_BUDGET_USD=$5.00"):
            spend.check_budget()

    @override_settings(CACHES=FAKE_REDIS)
    def test_on_redis_the_counter_is_one_prefixed_expiring_integer(self) -> None:
        cache.clear()  # the fake server outlives a test
        usage_row("0.50")
        self.assertEqual(spend.spent(spend.today()), Decimal("0.50"))
        record(ProviderUsage(input_tokens=1000, cached_tokens=900, output_tokens=3, reported=True))
        server = caches["vex"]._cache.get_client(write=True)  # type: ignore[attr-defined]  # pylint: disable=protected-access
        key = f"portfolio:1:vex:spend:{spend.today().isoformat()}"
        self.assertEqual(server.get(key), b"50002050")  # a plain integer, so INCRBY can raise it
        self.assertTrue(0 < server.ttl(key) <= spend.COUNTER_TTL_SECONDS)
        self.assertEqual(spend.spent(spend.today()), Decimal("0.5000205"))

    @override_settings(CACHES=REDIS_DOWN)
    def test_with_redis_down_the_table_decides_once_a_minute_and_the_error_is_logged(self) -> None:
        usage_row("4.00")
        with self.assertLogs("vex.utils.cache", level="ERROR") as logs:
            spend.check_budget()
            usage_row("2.00")
            spend.check_budget()  # the table's total from a moment ago still stands
            spend._fallback.clear()  # pylint: disable=protected-access  # a minute later
            with self.assertRaises(spend.Resting):
                spend.check_budget()
            record(ProviderUsage(input_tokens=10, output_tokens=1, reported=True))  # still recorded
        # One error for the outage, not one per use.
        self.assertEqual(len(logs.output), 1)
        self.assertIn("ConnectionError", logs.output[0])
        self.assertIn("the spend and the persona are read from the database", logs.output[0])
        self.assertEqual(Usage.objects.count(), 3)

    @override_settings(CACHES=REDIS_DOWN, TRUSTED_CLIENT_IP_HEADER="")
    def test_with_redis_down_the_limits_let_requests_through(self) -> None:
        view = APIView()
        view.throttle_scope = "vex_stream"  # type: ignore[attr-defined]
        request = view.initialize_request(RequestFactory().post("/"))
        with self.assertLogs("vex.utils.cache", level="ERROR") as logs:
            self.assertTrue(all(VexThrottle().allow_request(request, view) for _ in range(20)))
        self.assertEqual(len(logs.output), 1)
        self.assertIn("the limits are skipped", logs.output[0])

    @override_settings(CACHES=REDIS_DOWN)
    def test_with_redis_down_the_persona_is_read_afresh(self) -> None:
        ConfigurationFactory(i18n={"en": {"system_prompt": "Be breezy."}})
        with self.assertLogs("vex.utils.cache", level="ERROR"):
            self.assertEqual(persona("en"), "Be breezy.")

    @override_settings(CACHES=REDIS_DOWN, TRUSTED_CLIENT_IP_HEADER="")
    def test_with_redis_down_a_question_tries_redis_once(self) -> None:
        # Three limits, the budget check, the persona and the increment would each wait out a timeout of their own
        # on a Redis that hangs; the breaker makes the first failure stand for the rest.
        url = reverse("vex:stream")
        with (
            patch.object(redis.connection.Connection, "connect", autospec=True, side_effect=CONNECT) as connect,
            patch(STREAM, FakeModel(["Hi"])),
            patch("vex.ai.prompt.knowledge_base", return_value=SimpleNamespace(text="kb")),
            self.assertLogs("vex.utils.cache", level="ERROR") as logs,
        ):
            for _ in range(2):
                resp = self.client.post(
                    url, {"question": "Q"}, content_type="application/json", headers={SESSION_HEADER: session_key()}
                )
                self.assertEqual(parse_events(b"".join(resp.streaming_content).decode())[-1][0], "done")
        self.assertEqual(connect.call_count, 1)
        self.assertEqual(len(logs.output), 1)


@override_settings(VEX_DAILY_BUDGET_USD=Decimal("5.00"))
class SpendReportTestCase(TestCase):
    def setUp(self) -> None:
        usage_row("1.5", input_tokens=1000, cached_tokens=750)
        usage_row("0.5", input_tokens=1000, cached_tokens=250, outcome=Outcomes.ABANDONED, estimated=True)

    def test_the_command_reports_the_day(self) -> None:
        out = StringIO()
        call_command("vex_spend", stdout=out)
        self.assertIn(f"{spend.today().isoformat()} (UTC): $2.0000 of $5.00, 2 calls, 50% of 2000", out.getvalue())
        out = StringIO()
        call_command("vex_spend", "--date", "2020-01-01", stdout=out)
        self.assertIn("2020-01-01 (UTC): $0.0000 of $5.00, 0 calls", out.getvalue())

    # Without DEBUG the admin's CSS is looked up in collectstatic's manifest, which a test run has not built.
    @override_settings(
        STORAGES={
            **settings.STORAGES,
            "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
        }
    )
    def test_the_usage_list_is_headed_by_todays_spend(self) -> None:
        admin = get_user_model().objects.create_superuser("admin", "admin@example.com", "pw")
        self.client.force_login(admin)
        resp = self.client.get(reverse("admin:vex_usage_changelist"))
        self.assertContains(resp, "Today (UTC): $2.0000 of $5.00, 2 calls, 50% of input cached")
