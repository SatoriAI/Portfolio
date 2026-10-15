from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand

from vex.retention import purge_stale_conversations


class Command(BaseCommand):
    help = (
        "Delete Vex's conversations with no question in VEX_CONVERSATION_RETENTION_DAYS, now rather than after the "
        "day's first answer."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        count = purge_stale_conversations()
        self.stdout.write(
            f"Deleted {count} conversations with no question in {settings.VEX_CONVERSATION_RETENTION_DAYS} days"
        )
