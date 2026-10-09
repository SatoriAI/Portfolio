from typing import cast

from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import get_language, pgettext_lazy
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager, TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields

from utils.fields import LinesArrayField
from utils.models import DescriptiveModel, TimestampedModel
from work.choices import Icons


class Skill(TranslatableModel, TimestampedModel, DescriptiveModel):
    """
    A skill's years are not typed in: the site counts them from the roles that
    used it. Only what no role shows is stored: the year it was first used,
    where that came before its first role (university, own projects), and,
    for a tool taken up the year it came out, that it has been used since its
    launch, which then words the count.
    """

    since = models.PositiveSmallIntegerField(
        _("Used since"),
        null=True,
        blank=True,
        validators=[MinValueValidator(1990)],
        help_text=_(
            "The year it was first used, if before its first role, or its launch year. "
            "Leave empty to count from the roles."
        ),
    )
    since_launch = models.BooleanField(
        _("Since launch"),
        default=False,
        db_default=False,
        help_text=_("Used since it came out, in the year above; said instead of a count of years."),
    )
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
        lines = [f"Skill: {name}"]
        if self.since_launch:
            lines.append(f"Used since: its launch in {self.since}")
        elif self.since:
            lines.append(f"Used since: {self.since}, before the roles that show it")
        lines.append(f"Description: {description}")
        return "\n".join(lines)

    def clean(self) -> None:
        super().clean()
        if self.since and self.since > timezone.now().year:
            raise ValidationError({"since": _("The year cannot be in the future.")})

    class Meta:
        verbose_name = _("Skill")
        verbose_name_plural = _("Skills")
        constraints = [
            models.CheckConstraint(
                condition=~(models.Q(since_launch=True) & models.Q(since__isnull=True)),
                name="skill_since_launch_has_year",
                violation_error_message=_("Give the launch year for a skill used since launch."),
            )
        ]


class Project(TranslatableModel, TimestampedModel, DescriptiveModel):
    title = models.CharField(_("Title"), max_length=128)
    image = models.URLField(_("Image URL"), null=True, blank=True)
    tags = ArrayField(models.CharField(_("Tags"), max_length=128), null=True, blank=True)
    demo = models.URLField(_("Demo"), null=True, blank=True)
    repository = models.URLField(_("Repository"), null=True, blank=True)

    translations = TranslatedFields(
        description=models.TextField(_("Description"), null=True, blank=True),
        vex_question=models.CharField(
            _("Vex question"),
            max_length=255,
            blank=True,
            db_default="",
            help_text=_("What the Ask Vex prompt offers to ask about it. Leave empty for a general question."),
        ),
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


class ExperienceManager(TranslatableManager):
    # Where parler's manager (built with Manager.from_queryset) takes its queryset.
    _queryset_class = ExperienceQuerySet

    def visible(self) -> ExperienceQuerySet:
        return cast(ExperienceQuerySet, self.get_queryset()).visible()


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
        verbose_name=pgettext_lazy("experience", "Tools"),
        null=True,
        blank=True,
        help_text=_("Programming tools used in the role, e.g. Copilot, Claude Code."),
    )
    topics = ArrayField(
        models.CharField(max_length=128),
        verbose_name=pgettext_lazy("experience", "Topics"),
        null=True,
        blank=True,
        help_text=_("Subjects taught, for a teaching or training role."),
    )
    visible = models.BooleanField(
        _("Visible"),
        default=True,
        # In the database too, so the release before this one can still add a role.
        db_default=True,
        help_text=_("Shown on the site and to Vex. Uncheck to keep the role without showing it."),
    )

    translations = TranslatedFields(
        role=models.CharField(
            _("Role"),
            max_length=128,
            blank=True,
            # Kept in the database too, so the release before this one can still add a translation.
            db_default="",
            help_text=_("The role's title in this language; it replaces Position, still shown by the current site."),
        ),
        location=models.CharField(_("Location"), max_length=128),
        product=models.TextField(pgettext_lazy("experience", "Product"), null=True, blank=True),
        responsibilities=models.TextField(pgettext_lazy("experience", "Responsibilities"), null=True, blank=True),
        contributions=LinesArrayField(
            models.CharField(max_length=512),
            verbose_name=pgettext_lazy("experience", "Contributions"),
            null=True,
            blank=True,
        ),
        results=LinesArrayField(
            models.CharField(max_length=512),
            verbose_name=pgettext_lazy("experience", "Results"),
            null=True,
            blank=True,
        ),
        # Read by the current site; replaced by the four fields above.
        description=models.TextField(_("Description"), null=True, blank=True),
        achievements=LinesArrayField(models.CharField(_("Achievements"), max_length=512), null=True, blank=True),
        vex_question=models.CharField(
            _("Vex question"),
            max_length=255,
            blank=True,
            db_default="",
            help_text=_("What the Ask Vex prompt offers to ask about it. Leave empty for a general question."),
        ),
    )

    # Managers
    objects: ExperienceManager = ExperienceManager()

    @property
    def period(self) -> str:
        return f"{self.start.year} - {self.end.year if self.end is not None else ''}"

    @classmethod
    def vex_queryset(cls) -> ExperienceQuerySet:
        """Hidden roles stay out of Vex's context, as they do off the site."""
        return cls.objects.visible()

    def representation_for(self, locale: str | None) -> str:
        """
        The role as Vex reads it, in the reader's language, with only the parts
        it has. The old write-up comes in only where the new one leaves a gap:
        the old description when neither product nor responsibilities is
        written, the old achievements when neither contributions nor results
        is. Each pair covers the same ground, so Vex never reads two accounts
        of one role.
        """
        lang = (locale or get_language() or "").split("-")[0][:2]

        def text(field: str) -> str:
            return self.safe_translation_getter(field, language_code=lang, any_language=True) or ""

        def items(field: str) -> str:
            return "; ".join(self.safe_translation_getter(field, language_code=lang, any_language=True) or [])

        rewritten = bool(text("responsibilities") or text("product"))
        listed = bool(items("contributions") or items("results"))
        parts = [
            ("Period", self.period),
            ("Location", text("location")),
            ("Technologies", ", ".join(self.technologies or [])),
            ("Tools", ", ".join(self.tools or [])),
            ("Topics", ", ".join(self.topics or [])),
            ("Product", text("product")),
            ("Responsibilities", text("responsibilities")),
            ("Contributions", items("contributions")),
            ("Results", items("results")),
            ("Description", "" if rewritten else text("description")),
            ("Achievements", "" if listed else items("achievements")),
        ]
        heading = f"Experience: {text('role') or self.position} at {self.company}"
        # Only what the role has: an empty part tells Vex nothing.
        return "\n".join([heading, *(f"{label}: {value}" for label, value in parts if value)])

    class Meta:
        verbose_name = _("Experience")
        verbose_name_plural = _("Experiences")
