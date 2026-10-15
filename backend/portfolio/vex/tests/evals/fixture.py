"""The knowledge the evals run against, built in an empty test database: all of it about Jan Testowy, the invented
owner in owner.py, so nothing about Dawid, public or private, is in the evals.

- The site's database rows and the personal notes are created through the real models (owner.create_rows), and Vex
  reads them as production does (vex_queryset, representation_for).
- The site's writing is owner.SITE_BUNDLE, taken in as production takes the frontend's bundle (parse_site_bundle).
- The persona is the one the newest persona migration ships, with Jan in Dawid's place."""

import importlib
import pkgutil

from vex import migrations
from vex.ai.knowledge import Source, parse_site_bundle
from vex.models import Configuration
from vex.tests.evals import owner


def latest_persona() -> dict[str, str]:
    """The persona text, per language, of the newest migration that sets one (each defines it as PERSONA): what a
    database migrated from the start would hold had it had a Configuration all along."""
    names = sorted(module.name for module in pkgutil.iter_modules(migrations.__path__))
    for name in reversed(names):
        persona = getattr(importlib.import_module(f"{migrations.__name__}.{name}"), "PERSONA", None)
        if persona is not None:
            return dict(persona)
    raise LookupError("no migration in vex.migrations defines PERSONA")


def load() -> None:
    """Fills the (empty) test database with the knowledge above."""
    owner.create_rows()
    configuration = Configuration()
    for language, text in latest_persona().items():
        configuration.set_current_language(language)
        configuration.title = "Vex"
        # The persona names the owner by first name only ("Dawid's portfolio", "portfolio Dawida"); Jan declines
        # as Dawid does in Polish, so the swap reads naturally in both languages.
        configuration.system_prompt = text.replace("Dawid", owner.FIRST_NAME)
    configuration.save()


def site_sources(locale: str) -> list[Source]:
    """What Vex reads of the site in `locale`: owner.SITE_BUNDLE, taken in as production takes the frontend's
    bundle."""
    return parse_site_bundle({"sources": owner.SITE_BUNDLE[locale]})
