from django.contrib import admin
from parler.admin import TranslatableAdmin

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


@admin.register(Experience)
class ExperienceAdmin(TranslatableAdmin):
    list_display = (
        "position",
        "period",
        "created_at",
    )
    search_fields = ("position",)
