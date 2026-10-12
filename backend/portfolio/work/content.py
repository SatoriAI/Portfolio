"""
The work content (skills and roles, with every translation) as plain data, so
one database can be made to match another: `export_work` writes it from the
database the content is edited in, `import_work` makes another one match it.

A row is matched by its primary key, so the same skill or role keeps its id
everywhere and nothing that refers to it moves. A row the other database has
and the data does not is reported, never deleted: content removed by mistake
would otherwise be removed twice.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import Any

from django.core.management.color import no_style
from django.db import connection, models, transaction
from parler.models import TranslatableModel

from work.models import Experience, Skill

# In dependency order; neither refers to the other today.
MODELS: tuple[type[TranslatableModel], ...] = (Skill, Experience)
FORMAT = 1
# Kept by each database for itself.
SKIPPED = {"id", "created_at", "updated_at"}


def _label(model: type[models.Model]) -> str:
    return model._meta.label  # pylint: disable=protected-access


def _shared_fields(model: type[TranslatableModel]) -> list[models.Field[Any, Any]]:
    return [
        f
        for f in model._meta.concrete_fields  # pylint: disable=protected-access
        if f.name not in SKIPPED
    ]


def _translated_fields(model: type[TranslatableModel]) -> list[models.Field[Any, Any]]:
    translations = model._parler_meta.root_model  # pylint: disable=protected-access
    return [
        f
        for f in translations._meta.concrete_fields  # pylint: disable=protected-access
        if f.name not in SKIPPED | {"master", "language_code"}
    ]


def _plain(value: Any) -> Any:
    """A field's value as JSON can hold it."""
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, tuple):
        return list(value)
    return value


def export() -> dict[str, Any]:
    """Every skill and role, with its translations, as plain data."""
    data: dict[str, Any] = {"format": FORMAT, "models": {}}
    for model in MODELS:
        rows = []
        for obj in model.objects.order_by("pk").prefetch_related("translations"):
            rows.append(
                {
                    "pk": obj.pk,
                    "fields": {f.name: _plain(f.value_from_object(obj)) for f in _shared_fields(model)},
                    "translations": {
                        t.language_code: {f.name: _plain(f.value_from_object(t)) for f in _translated_fields(model)}
                        for t in obj.translations.all()
                    },
                }
            )
        data["models"][_label(model)] = rows
    return data


@dataclass
class Report:
    """What an import changed, or would change."""

    created: list[str] = field(default_factory=list)
    changed: list[str] = field(default_factory=list)
    unmatched: list[str] = field(default_factory=list)

    @property
    def lines(self) -> list[str]:
        return (
            [f"+ {line}" for line in self.created]
            + [f"~ {line}" for line in self.changed]
            + [f"? {line} (not in the data; left as it is)" for line in self.unmatched]
        )


def _short(value: Any, width: int = 60) -> str:
    text = repr(value)
    return text if len(text) <= width else f"{text[: width - 1]}…"


def _apply_row(model: type[TranslatableModel], row: dict[str, Any], report: Report) -> None:
    name = f"{model.__name__} {row['pk']}"
    obj = model.objects.filter(pk=row["pk"]).first()
    created = obj is None
    if obj is None:
        obj = model(pk=row["pk"])
    changes: list[str] = []
    for f in _shared_fields(model):
        if f.name not in row["fields"]:
            continue
        wanted = f.to_python(row["fields"][f.name])
        current = f.value_from_object(obj)
        if created or wanted != current:
            setattr(obj, f.attname, wanted)
            changes.append(f"{f.name}: {_short(current)} → {_short(wanted)}")
    for language, values in row["translations"].items():
        obj.set_current_language(language)
        has = obj.has_translation(language)
        for f in _translated_fields(model):
            if f.name not in values:
                continue
            wanted = f.to_python(values[f.name])
            current = getattr(obj, f.name, None) if has else None
            if not has or wanted != current:
                setattr(obj, f.name, wanted)
                changes.append(f"{f.name}[{language}]: {_short(current)} → {_short(wanted)}")
    if not changes:
        return
    # Saves the translations set above too, every language at once.
    obj.save()
    (report.created if created else report.changed).append(f"{name}: " + "; ".join(changes))


class _DryRun(Exception):
    """Unwinds the transaction after a dry run has seen every change."""


def import_(data: dict[str, Any], *, apply: bool) -> Report:
    """
    Make this database's skills and roles match the data, in one transaction.
    Without `apply` the same work is done and then rolled back, so the report
    is exactly what applying would do.
    """
    if data.get("format") != FORMAT:
        raise ValueError(f"Unknown format {data.get('format')!r}; expected {FORMAT}.")
    report = Report()
    try:
        with transaction.atomic():
            for model in MODELS:
                rows = data["models"].get(_label(model), [])
                for row in rows:
                    _apply_row(model, row, report)
                wanted = {row["pk"] for row in rows}
                for pk in model.objects.exclude(pk__in=wanted).values_list("pk", flat=True):
                    report.unmatched.append(f"{model.__name__} {pk}")
            # Rows inserted with their own ids leave the id sequences behind, and
            # the next row added in the admin would collide with one of them.
            with connection.cursor() as cursor:
                tables = [*MODELS, *(m._parler_meta.root_model for m in MODELS)]  # pylint: disable=protected-access
                for statement in connection.ops.sequence_reset_sql(no_style(), tables):
                    cursor.execute(statement)
            if not apply:
                raise _DryRun
    except _DryRun:
        pass
    return report
