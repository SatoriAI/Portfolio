from argparse import ArgumentParser
from datetime import date
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand

from vex.ai import spend


class Command(BaseCommand):
    help = "Show what Vex spent on the model in one UTC day (today by default), against its daily budget."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("--date", type=date.fromisoformat, help="The UTC day, as YYYY-MM-DD.")

    def handle(self, *args: Any, **options: Any) -> None:
        day = options["date"] or spend.today()
        totals = spend.day_spend(day)
        budget = settings.VEX_DAILY_BUDGET_USD
        resting = " (resting)" if day == spend.today() and totals.dollars >= budget else ""
        self.stdout.write(
            f"{day.isoformat()} (UTC): ${totals.dollars:.4f} of ${budget}{resting}, {totals.calls} calls, "
            f"{totals.cached_share:.0%} of {totals.input_tokens} input tokens cached"
        )
