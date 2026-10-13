from argparse import ArgumentParser
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand

from vex.ai import knowledge
from vex.ai.prompt import PROMPT_VERSION, system_prompt


class Command(BaseCommand):
    help = "Show what Vex knows in one language: its sources and their size, or (with --dump) the whole system prompt."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("--locale", choices=[code for code, _name in settings.LANGUAGES], default="en")
        parser.add_argument(
            "--dump", action="store_true", help="Print the system prompt exactly as the model reads it."
        )

    def handle(self, *args: Any, **options: Any) -> None:
        locale = options["locale"]
        knowledge.clear_cache()
        prompt = system_prompt(locale)
        if options["dump"]:
            self.stdout.write(prompt)
            return
        base = knowledge.knowledge_base(locale)
        self.stdout.write(f"{'kind':<9} {'path':<44} {'~tokens':>8}  title")
        for source in base.sources:
            tokens = knowledge.estimate_tokens(source.render())
            self.stdout.write(f"{source.kind:<9} {source.path or '-':<44} {tokens:>8}  {source.title}")
        site = "loaded" if base.site_loaded else f"NOT loaded (VEX_SITE_CONTENT_URL={settings.VEX_SITE_CONTENT_URL!r})"
        self.stdout.write(
            f"\nlocale {locale}, {len(base.sources)} sources, digest {base.digest}, site content {site}\n"
            f"knowledge ~{knowledge.estimate_tokens(base.text)} tokens ({len(base.text)} characters); "
            f"system prompt ~{knowledge.estimate_tokens(prompt)} tokens; prompt version {PROMPT_VERSION}; "
            f"model {settings.VEX_MODEL}, reasoning effort {settings.VEX_REASONING_EFFORT}"
        )
