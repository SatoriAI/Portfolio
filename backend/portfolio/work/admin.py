from django.contrib import admin
from parler.admin import TranslatableAdmin

from work.models import Experience, Project, Skill


@admin.register(Skill)
class SkillAdmin(TranslatableAdmin):
    list_display = (
        "name",
        "since",
        "since_launch",
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
