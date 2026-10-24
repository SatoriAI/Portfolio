from typing import Any

from django.conf import settings
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from work.models import Experience, Project, Skill, SkillCategory, TechnologyTerm


@admin.register(TechnologyTerm)
class TechnologyTermAdmin(TranslatableAdmin):
    list_display = ("name", "labels")
    search_fields = ("name",)

    def get_queryset(self, request: HttpRequest) -> QuerySet[TechnologyTerm]:
        return super().get_queryset(request).prefetch_related("translations")

    @admin.display(description=_("Labels"))
    def labels(self, obj: TechnologyTerm) -> str:
        labels = {translation.language_code: translation.label for translation in obj.translations.all()}
        return ", ".join(f"{code}: {labels[code]}" for code, _name in settings.LANGUAGES if code in labels)


@admin.register(SkillCategory)
class SkillCategoryAdmin(TranslatableAdmin):
    list_display = ("name", "order")
    list_editable = ("order",)


@admin.register(Skill)
class SkillAdmin(TranslatableAdmin):
    list_display = (
        "name",
        "category",
        "order",
        "since",
        "since_launch",
        "created_at",
    )
    list_editable = ("category", "order")
    list_filter = ("category",)
    list_select_related = ("category",)
    search_fields = ("name",)

    def formfield_for_foreignkey(self, db_field: Any, request: HttpRequest, **kwargs: Any) -> Any:
        field = super().formfield_for_foreignkey(db_field, request, **kwargs)
        if db_field.name == "category":
            # The list edits every row's category, and each row's field would otherwise fetch the categories and
            # their translated names again; they are fetched once per request instead.
            choices = getattr(request, "_skill_category_choices", None)
            if choices is None:
                categories = SkillCategory.objects.prefetch_related("translations")
                choices = [("", field.empty_label), *((category.pk, str(category)) for category in categories)]
                setattr(request, "_skill_category_choices", choices)
            field.choices = choices
        return field


@admin.register(Project)
class ProjectAdmin(TranslatableAdmin):
    list_display = (
        "title",
        "demo",
        "mobile",
        "created_at",
    )
    list_filter = ("mobile",)
    search_fields = ("title",)


@admin.register(Experience)
class ExperienceAdmin(TranslatableAdmin):
    list_display = (
        "position",
        "company",
        "period",
        "visible",
        "created_at",
    )
    list_filter = ("visible",)
    search_fields = ("position", "translations__role", "company")
