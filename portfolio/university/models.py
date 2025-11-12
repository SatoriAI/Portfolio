from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager
from parler.models import TranslatableModel, TranslatedFields

from university.choices import Degrees, Seasons
from utils.models import TimestampedModel


class School(TranslatableModel, TimestampedModel):
    start = models.DateField(_("Start"))
    end = models.DateField(_("End"), null=True, blank=True)

    translations = TranslatedFields(
        study=models.CharField(_("Study"), max_length=128),
        degree=models.CharField(_("Degree"), choices=Degrees, default=Degrees.BACHELOR, max_length=64),
        university=models.CharField(_("University"), max_length=128),
        research=models.TextField(_("Research")),
        advisor=models.CharField(_("Advisor"), null=True, blank=True, max_length=256),
        areas=ArrayField(models.CharField(_("Areas"), max_length=128), null=True, blank=True),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("School")
        verbose_name_plural = _("Schools")


class Publication(TranslatableModel, TimestampedModel):
    journal = models.CharField(_("Journal"), max_length=256)
    link = models.URLField(_("Link"), null=True, blank=True)
    year = models.PositiveSmallIntegerField(_("Year"))

    translations = TranslatedFields(
        title=models.CharField(_("Title"), max_length=256),
        summary=models.TextField(_("Summary")),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("Publication")
        verbose_name_plural = _("Publications")


class Testimonial(TranslatableModel, TimestampedModel):
    semester = models.CharField(_("Semester"), max_length=128)
    season = models.CharField(_("Season"), choices=Seasons, max_length=8)

    translations = TranslatedFields(
        course=models.CharField(_("Course"), max_length=128),
        content=models.TextField(_("Content")),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("Testimonial")
        verbose_name_plural = _("Testimonials")
