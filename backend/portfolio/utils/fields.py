from typing import Any

from django import forms
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.forms import SimpleArrayField
from django.utils.translation import gettext_lazy as _


class LinesFormField(SimpleArrayField):
    """
    A list edited in a textarea, one item per line: a comma inside an item
    stays in it, and blank lines (a trailing Enter, a gap between items) are
    ignored rather than rejected.
    """

    def __init__(self, base_field: forms.Field, **kwargs: Any) -> None:
        kwargs.setdefault("widget", forms.Textarea(attrs={"rows": 5}))
        kwargs.setdefault("help_text", _("One item per line."))
        super().__init__(base_field, delimiter="\n", **kwargs)

    def to_python(self, value: Any) -> Any:
        if isinstance(value, str):
            value = "\n".join(line for line in value.splitlines() if line.strip())
        return super().to_python(value)


class LinesArrayField(ArrayField):
    """An ArrayField of sentences, edited one per line wherever a form is built from it."""

    def formfield(
        self,
        form_class: type[forms.Field] | None = None,
        choices_form_class: type[forms.ChoiceField] | None = None,
        **kwargs: Any,
    ) -> forms.Field | None:
        return super().formfield(
            form_class=form_class or LinesFormField, choices_form_class=choices_form_class, **kwargs
        )
