import json
from typing import Any

from django.core.management.base import BaseCommand

from work.content import export


class Command(BaseCommand):
    help = "Write every skill and role, with its translations, as JSON (see work.content)."

    def handle(self, *args: Any, **options: Any) -> None:
        self.stdout.write(json.dumps(export(), ensure_ascii=False, indent=1))
