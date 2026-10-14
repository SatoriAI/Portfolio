"""What Vex has spent on the model in a UTC day, against settings.VEX_DAILY_BUDGET_USD.

The source of truth is vex.models.Usage, one row per call however it ended (answered, empty, abandoned, failed;
estimated or reported). Adding that table up before every question would be a query per request, so the day's total
is also kept as a counter in the "vex" cache (Redis in production, shared by every worker), raised atomically right
after each row is written. Only the budget check creates the counter, from the table's total, and only where there is
none (SET NX): a plain SET could overwrite increments made since the total was read, and an increment that created a
missing counter would count its call again on top of a total that already holds it. So an increment that finds no
counter does nothing; the next check seeds one from the table, which holds that call. The counter expires early on
purpose and is seeded again, so a call it missed (Redis briefly down, a worker killed between the row and the
increment) is counted within minutes. While Redis is down the table is read instead, at most once a minute per process.

The check and the counter are not one transaction: questions asked at the same moment can all pass a check just
under the budget, so a day can end a few calls over it. At a fraction of a cent a call, that is accepted. A call
written while another process reads the total can still be counted twice, or once too few, until the counter expires;
twice only ever errs towards resting early."""

import time
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Count, Sum

from vex.models import Usage
from vex.utils.cache import CacheUnavailable, cache

# Usage.cost's precision. The counter holds whole units of it, so it adds up to exactly what the table does, and Redis
# raises it with INCRBY rather than a read and a write.
UNIT = Decimal("0.00000001")
# How long a counter lives before it is reseeded from the table: one query per this long, and the most a missed call
# can stay uncounted.
COUNTER_TTL_SECONDS = 10 * 60
# How long one process reuses the table's total while Redis is down.
FALLBACK_TTL_SECONDS = 60

_fallback: dict[date, tuple[float, int]] = {}


class Resting(Exception):
    """The day's budget is spent: Vex does not call the model again until the next UTC day."""


@dataclass(frozen=True)
class DaySpend:
    day: date
    dollars: Decimal
    calls: int
    input_tokens: int
    cached_tokens: int

    @property
    def cached_share(self) -> float:
        """The share of input tokens served from OpenAI's prompt cache."""
        return self.cached_tokens / self.input_tokens if self.input_tokens else 0.0


def today() -> date:
    return datetime.now(UTC).date()


def day_spend(day: date) -> DaySpend:
    """The day's calls as the table holds them: one query."""
    start = datetime.combine(day, datetime.min.time(), tzinfo=UTC)
    totals = Usage.objects.filter(created_at__gte=start, created_at__lt=start + timedelta(days=1)).aggregate(
        dollars=Sum("cost"), calls=Count("pk"), input_tokens=Sum("input_tokens"), cached_tokens=Sum("cached_tokens")
    )
    return DaySpend(
        day=day,
        dollars=totals["dollars"] or Decimal(0),
        calls=totals["calls"],
        input_tokens=totals["input_tokens"] or 0,
        cached_tokens=totals["cached_tokens"] or 0,
    )


def counter_key(day: date) -> str:
    # The cache prefixes it ("portfolio:1:vex:spend:2026-10-14" in Redis).
    return f"vex:spend:{day.isoformat()}"


def seed(day: date) -> int:
    """Creates the day's counter from the table's total, in units, unless another thread just did, and returns it."""
    units = int(day_spend(day).dollars / UNIT)
    cache.add(counter_key(day), units, COUNTER_TTL_SECONDS)
    return units


def fallback_units(day: date) -> int:
    """The table's total for the day, read at most once a minute in this process."""
    if (memo := _fallback.get(day)) is not None and time.monotonic() - memo[0] < FALLBACK_TTL_SECONDS:
        return memo[1]
    units = int(day_spend(day).dollars / UNIT)
    _fallback[day] = (time.monotonic(), units)
    return units


def spent(day: date) -> Decimal:
    """The day's spend in dollars, from the counter where there is one."""
    try:
        units = cache.get(counter_key(day))
        if units is None:
            units = seed(day)
    except CacheUnavailable:
        units = fallback_units(day)  # the breaker has logged it
    return units * UNIT


def check_budget() -> None:
    """Raises Resting once today's spend has reached the budget."""
    if (dollars := spent(today())) >= settings.VEX_DAILY_BUDGET_USD:
        raise Resting(f"today's spend ${dollars:.4f} reached VEX_DAILY_BUDGET_USD=${settings.VEX_DAILY_BUDGET_USD}")


def add(cost: Decimal | None, day: date) -> None:
    """Counts one call already written to the table, on the day its row was written."""
    if not cost:
        return
    units = int(cost / UNIT)
    key = counter_key(day)
    try:
        if cache.incr(key, units) == units:
            # Django checks the key exists and then runs INCRBY. If it expired in between, INCRBY recreated it holding
            # this call alone and with no expiry; dropping it lets the next check seed it from the table. (A counter
            # seeded at zero is dropped too, which costs one more SUM.)
            cache.delete(key)
    except ValueError:
        pass  # no counter: the next check seeds one from the table, which already holds this call
    except CacheUnavailable:
        pass  # the breaker has logged it; the counter is reseeded from the table once it expires
