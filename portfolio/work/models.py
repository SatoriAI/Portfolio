from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager
from parler.models import TranslatableModel, TranslatedFields

from utils.models import TimestampedModel
from work.choices import Levels


class Skill(TranslatableModel, TimestampedModel):
    level = models.CharField(choices=Levels, default=Levels.INTERMEDIATE)
    image = models.URLField(_("Image URL"), null=True, blank=True)

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=128),
        description=models.TextField(_("Description"), null=True, blank=True),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("Skill")
        verbose_name_plural = _("Skills")


class Project(TranslatableModel, TimestampedModel):
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

    class Meta:
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")


class Experience(TranslatableModel, TimestampedModel):
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
        return f"{self.start.year} - {self.end if self.end is not None else ''}"

    class Meta:
        verbose_name = _("Experience")
        verbose_name_plural = _("Experiences")
