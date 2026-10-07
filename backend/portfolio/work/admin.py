from django import forms
from django.contrib import admin
from django.contrib.postgres.forms import SimpleArrayField
from django.utils.functional import Promise
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy
from parler.admin import TranslatableAdmin
from parler.forms import TranslatableModelForm

from work.models import Experience, Project, Skill


@admin.register(Skill)
class SkillAdmin(TranslatableAdmin):
    list_display = (
        "name",
        "level",
        "created_at",
    )
    search_fields = ("name",)


@admin.register(Project)
class ProjectAdmin(TranslatableAdmin):
    list_display = (
        "title",
        "demo",
        "created_at",
    )
    search_fields = ("title",)


def _one_per_line(label: str | Promise) -> SimpleArrayField:
    """A list of sentences edited one per line: a comma inside a sentence stays in it."""
    return SimpleArrayField(
        forms.CharField(max_length=512),
        delimiter="\n",
        widget=forms.Textarea(attrs={"rows": 5}),
        required=False,
        label=label,
        help_text=_("One item per line."),
    )


class ExperienceAdminForm(TranslatableModelForm):  # pylint: disable=too-many-ancestors
    contributions = _one_per_line(pgettext_lazy("experience", "Contributions"))
    results = _one_per_line(pgettext_lazy("experience", "Results"))
    achievements = _one_per_line(_("Achievements"))

    class Meta:
        model = Experience
        fields = "__all__"


@admin.register(Experience)
class ExperienceAdmin(TranslatableAdmin):
    form = ExperienceAdminForm
    list_display = (
        "position",
        "company",
        "period",
        "visible",
        "created_at",
    )
    list_filter = ("visible",)
    search_fields = ("position", "translations__role", "company")
