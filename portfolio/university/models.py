from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager
from parler.models import TranslatableModel, TranslatedFields

from university.choices import Degrees, Seasons
from utils.models import TimestampedModel


class School(TranslatableModel, TimestampedModel):
    start = models.DateField(_("Start"))
    end = models.DateField(_("End"), null=True, blank=True)
    degree = models.CharField(_("Degree"), choices=Degrees, default=Degrees.BACHELOR, max_length=64)

    translations = TranslatedFields(
        study=models.CharField(_("Study"), max_length=128),
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

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        study = self.safe_translation_getter("study", language_code=lang, any_language=True) or ""
        university = self.safe_translation_getter("university", language_code=lang, any_language=True) or ""
        research = self.safe_translation_getter("research", language_code=lang, any_language=True) or ""
        advisor = self.safe_translation_getter("advisor", language_code=lang, any_language=True) or ""
        areas = ", ".join(self.safe_translation_getter("areas", language_code=lang, any_language=True) or [])
        period = f"{self.start.year} - {self.end.year if self.end is not None else ''}"
        return (
            f"School: {study} at {university}\nPeriod: {period}\nResearch: {research}\n"
            f"Advisor: {advisor}\nAreas: {areas}"
        )


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

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        summary = self.safe_translation_getter("summary", language_code=lang, any_language=True) or ""
        return (
            f"Publication: {self.title}\nJournal: {self.journal}\nYear: {self.year}\n"
            f"Link: {self.link or ''}\nSummary: {summary}"
        )


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

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        course = self.safe_translation_getter("course", language_code=lang, any_language=True) or ""
        content = self.safe_translation_getter("content", language_code=lang, any_language=True) or ""
        season_display = self.get_season_display()
        return f"Testimonial: {course}\nSemester: {self.semester}\nSeason: {season_display}\n" f"Content: {content}"
