from typing import Any

from django.contrib import admin
from django.http import HttpRequest
from parler.admin import TranslatableAdmin

from work.models import Experience, Project, Skill, SkillCategory


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
