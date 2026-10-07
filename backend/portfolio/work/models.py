from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager, TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields

from utils.models import DescriptiveModel, TimestampedModel
from work.choices import Icons, Levels


class Skill(TranslatableModel, TimestampedModel, DescriptiveModel):
    level = models.CharField(choices=Levels, default=Levels.INTERMEDIATE)
    icon = models.CharField(choices=Icons, default=Icons.CODE, max_length=16)

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


class ExperienceQuerySet(TranslatableQuerySet):
    def visible(self) -> "ExperienceQuerySet":
        """The roles shown on the site and given to Vex; a hidden one is kept but not shown."""
        return self.filter(visible=True)


class Experience(TranslatableModel, TimestampedModel, DescriptiveModel):
    # `position` is the shared, untranslated title the current site reads; `role`
    # (translated) replaces it, and `position` goes once the site reads `role`.
    position = models.CharField(_("Position"), max_length=128)
    start = models.DateField(_("Start"))
    end = models.DateField(_("End"), null=True, blank=True)
    company = models.CharField(_("Company"), max_length=128)
    technologies = ArrayField(models.CharField(_("Technologies"), max_length=128), null=True, blank=True)
    tools = ArrayField(
        models.CharField(max_length=128),
        verbose_name=_("Tools"),
        null=True,
        blank=True,
        help_text=_("Programming tools used in the role, e.g. Copilot, Claude Code."),
    )
    topics = ArrayField(
        models.CharField(max_length=128),
        verbose_name=_("Topics"),
        null=True,
        blank=True,
        help_text=_("Subjects taught, for a teaching or training role."),
    )
    visible = models.BooleanField(
        _("Visible"),
        default=True,
        help_text=_("Shown on the site and to Vex. Uncheck to keep the role without showing it."),
    )

    translations = TranslatedFields(
        role=models.CharField(_("Role"), max_length=128, blank=True),
        location=models.CharField(_("Location"), max_length=128),
        product=models.TextField(_("Product"), null=True, blank=True),
        responsibilities=models.TextField(_("Responsibilities"), null=True, blank=True),
        contributions=ArrayField(
            models.CharField(max_length=512), verbose_name=_("Contributions"), null=True, blank=True
        ),
        results=ArrayField(models.CharField(max_length=512), verbose_name=_("Results"), null=True, blank=True),
        # Read by the current site; replaced by the four fields above.
        description=models.TextField(_("Description"), null=True, blank=True),
        achievements=ArrayField(models.CharField(_("Achievements"), max_length=512), null=True, blank=True),
    )

    # Managers
    objects = TranslatableManager.from_queryset(ExperienceQuerySet)()

    @property
    def period(self) -> str:
        return f"{self.start.year} - {self.end.year if self.end is not None else ''}"

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]

        def text(field: str) -> str:
            return self.safe_translation_getter(field, language_code=lang, any_language=True) or ""

        def items(field: str) -> str:
            return "; ".join(self.safe_translation_getter(field, language_code=lang, any_language=True) or [])

        lines = [
            f"Experience: {text('role') or self.position} at {self.company}",
            f"Period: {self.period}",
            f"Location: {text('location')}",
            f"Technologies: {', '.join(self.technologies or [])}",
            f"Tools: {', '.join(self.tools or [])}",
            f"Topics: {', '.join(self.topics or [])}",
            f"Product: {text('product')}",
            f"Responsibilities: {text('responsibilities')}",
            f"Contributions: {items('contributions')}",
            f"Results: {items('results')}",
            f"Description: {text('description')}",
            f"Achievements: {items('achievements')}",
        ]
        # Only what the role has: an empty line tells Vex nothing.
        return "\n".join(line for line in lines if not line.endswith(": "))

    class Meta:
        verbose_name = _("Experience")
        verbose_name_plural = _("Experiences")
