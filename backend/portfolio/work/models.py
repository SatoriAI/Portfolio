from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager
from parler.models import TranslatableModel, TranslatedFields

from utils.models import DescriptiveModel, TimestampedModel
from work.choices import Icons, Levels


class Skill(TranslatableModel, TimestampedModel, DescriptiveModel):
    level = models.CharField(choices=Levels, default=Levels.INTERMEDIATE)
    icon = models.CharField(choices=Icons, default=Icons.CODE, max_length=8)

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=128),
        description=models.TextField(_("Description"), null=True, blank=True),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        name = self.safe_translation_getter("name", language_code=lang, any_language=True) or ""
        description = self.safe_translation_getter("description", language_code=lang, any_language=True) or ""
        return f"Skill: {name}\nLevel: {self.level}\nDescription: {description}"

    class Meta:
        verbose_name = _("Skill")
        verbose_name_plural = _("Skills")


class Project(TranslatableModel, TimestampedModel, DescriptiveModel):
    title = models.CharField(_("Title"), max_length=128)
    image = models.URLField(_("Image URL"), null=True, blank=True)
    tags = ArrayField(models.CharField(_("Tags"), max_length=128), null=True, blank=True)
    demo = models.URLField(_("Demo"), null=True, blank=True)
    repository = models.URLField(_("Repository"), null=True, blank=True)

    translations = TranslatedFields(
        description=models.TextField(_("Description"), null=True, blank=True),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        description = self.safe_translation_getter("description", language_code=lang, any_language=True) or ""
        tags = ", ".join(self.tags or [])
        return (
            f"Project: {self.title}\nTags: {tags}\nDescription: {description}\n"
            f"Demo: {self.demo or ''}\nRepository: {self.repository or ''}"
        )

    class Meta:
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")


class Experience(TranslatableModel, TimestampedModel, DescriptiveModel):
    position = models.CharField(_("Position"), max_length=128)
    start = models.DateField(_("Start"))
    end = models.DateField(_("End"), null=True, blank=True)
    company = models.CharField(_("Company"), max_length=128)
    technologies = ArrayField(models.CharField(_("Technologies"), max_length=128), null=True, blank=True)

    translations = TranslatedFields(
        location=models.CharField(_("Location"), max_length=128),
        description=models.TextField(_("Description"), null=True, blank=True),
        achievements=ArrayField(models.CharField(_("Achievements"), max_length=512), null=True, blank=True),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    @property
    def period(self) -> str:
        return f"{self.start.year} - {self.end.year if self.end is not None else ''}"

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        location = self.safe_translation_getter("location", language_code=lang, any_language=True) or ""
        description = self.safe_translation_getter("description", language_code=lang, any_language=True) or ""
        achievements = "; ".join(
            self.safe_translation_getter("achievements", language_code=lang, any_language=True) or []
        )
        technologies = ", ".join(self.technologies or [])
        return (
            f"Experience: {self.position} at {self.company}\nPeriod: {self.period}\nLocation: {location}\n"
            f"Technologies: {technologies}\nDescription: {description}\nAchievements: {achievements}"
        )

    class Meta:
        verbose_name = _("Experience")
        verbose_name_plural = _("Experiences")
