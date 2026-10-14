"""The knowledge the evals run against by default, built in an empty test database: nothing in it is private.

- The site's database rows (roles, skills, projects, degrees, publications, testimonials) come from public.json:
  exactly the rows Vex reads and the public API serves, as dump_public() writes them from a database that holds the
  real content. Refresh it when the site's content changes in a way the golden set asks about.
- The site's Markdown is read from frontend/src/content, as the frontend's build publishes it for Vex.
- Dawid's personal documents are never in the repository. In their place is SYNTHETIC_DOCUMENTS: personal facts
  made up for the evals, which the golden set's personal cases ask about.
- The persona is the one the newest persona migration ships."""

import importlib
import pkgutil
import re
from pathlib import Path

from django.core import serializers
from django.core.management import call_command
from django.db import models

from vex import migrations
from vex.ai.knowledge import DATABASE_SECTIONS, Source
from vex.models import Configuration, Document

PUBLIC_FIXTURE = Path(__file__).with_name("public.json")
CONTENT = Path(__file__).resolve().parents[5] / "frontend" / "src" / "content"

# Made up, and plainly so to anyone reading this file: none of it is true of Dawid. Each language has the same facts,
# with two favourite dishes so a case can check that a recipe is given for the first.
SYNTHETIC_DOCUMENTS: dict[str, tuple[str, str]] = {
    "en": (
        "Personal notes",
        "Favourite dishes: first shakshuka, then pad thai.\n"
        "Sport: underwater hockey, twice a week.\n"
        "Favourite film: Paddington 2.\n"
        "Best trip so far: Svalbard, to see the polar night.",
    ),
    "pl": (
        "Notatki osobiste",
        "Ulubione dania: na pierwszym miejscu szakszuka, potem pad thai.\n"
        "Sport: hokej podwodny, dwa razy w tygodniu.\n"
        "Ulubiony film: Paddington 2.\n"
        "Najlepsza podróż do tej pory: Svalbard, żeby zobaczyć noc polarną.",
    ),
}

# A content file Vex reads, `<slug>.<pl|en>.md`; drafts (`.draft.md`) and the folders' READMEs do not match.
CONTENT_FILE = re.compile(r"^([a-z0-9-]+)\.(pl|en)\.md$")
PAGES = {"projects": lambda slug: "/#projects", "workshop": lambda slug: f"/workshop/{slug}"}
HEADER = re.compile(r"^---\r?\n(.*?)\r?\n---", re.DOTALL)


def public_rows() -> list[models.Model]:
    """The rows Vex reads from the site's database (vex_queryset, the same filter the public API applies), with their
    translations."""
    rows: list[models.Model] = []
    for model, *_ in DATABASE_SECTIONS:
        shown = list(model.vex_queryset().order_by("pk"))  # type: ignore[attr-defined]
        translations = model._meta.get_field("translations").related_model
        rows += shown
        rows += translations.objects.filter(master__in=shown).order_by("pk")  # type: ignore[union-attr]
    return rows


def dump_public() -> None:
    """Writes public.json from the configured database: `uv run python manage.py shell -c "from
    vex.tests.evals.fixture import dump_public; dump_public()"` from backend/portfolio."""
    with PUBLIC_FIXTURE.open("w", encoding="utf-8") as file:
        serializers.serialize("json", public_rows(), indent=2, ensure_ascii=False, stream=file)


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
    call_command("loaddata", PUBLIC_FIXTURE, verbosity=0)
    for language, (title, content) in SYNTHETIC_DOCUMENTS.items():
        Document.objects.create(title=title, content=content, language=language)
    configuration = Configuration()
    for language, text in latest_persona().items():
        configuration.set_current_language(language)
        configuration.title = "Vex"
        configuration.system_prompt = text
    configuration.save()


def site_sources(locale: str) -> list[Source]:
    """The site's Markdown as the frontend's build publishes it for Vex (frontend/src/lib/vexKnowledge.ts): every
    project write-up and workshop piece, ordered by folder and slug, in `locale` where it exists and otherwise in the
    other language, header included, titled by its header."""
    documents: dict[tuple[str, str], dict[str, Path]] = {}
    for folder in PAGES:
        for path in sorted((CONTENT / folder).iterdir()):
            if match := CONTENT_FILE.match(path.name):
                slug, language = match.groups()
                documents.setdefault((folder, slug), {})[language] = path
    sources = []
    for (folder, slug), by_language in sorted(documents.items()):
        raw = (by_language.get(locale) or next(iter(by_language.values()))).read_text(encoding="utf-8")
        sources.append(Source("site", header_title(raw) or slug, raw.strip(), PAGES[folder](slug)))
    return sources


def header_title(raw: str) -> str:
    """The `title:` line of a content file's header, as lib/workshop.ts's parseHeader reads it."""
    if header := HEADER.match(raw):
        for line in header.group(1).splitlines():
            key, colon, value = line.partition(":")
            if colon and key.strip() == "title":
                value = value.strip()
                return value[1:-1] if len(value) > 1 and value[0] == value[-1] == '"' else value
    return ""
