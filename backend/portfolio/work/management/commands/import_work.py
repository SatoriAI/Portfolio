import json
import sys
from argparse import ArgumentParser
from typing import Any

from django.core.management.base import BaseCommand

from work.content import import_


class Command(BaseCommand):
    help = (
        "Make this database's skills and roles match JSON from export_work, matched by id. "
        "Reports what would change; writes only with --apply."
    )

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("path", help="The JSON file, or - for standard input.")
        parser.add_argument("--apply", action="store_true", help="Write the changes (default: only report them).")

    def handle(self, *args: Any, **options: Any) -> None:
        if options["path"] == "-":
            data = json.load(sys.stdin)
        else:
            with open(options["path"], encoding="utf-8") as file:
                data = json.load(file)
        report = import_(data, apply=options["apply"])
        for line in report.lines:
            self.stdout.write(line)
        verb = "Applied" if options["apply"] else "Would apply (dry run, nothing written)"
        self.stdout.write(
            f"{verb}: {len(report.created)} created, {len(report.changed)} changed, "
            f"{len(report.unmatched)} left as they are."
        )
