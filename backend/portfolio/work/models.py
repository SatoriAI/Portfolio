from collections.abc import Iterable
from functools import cached_property
from typing import Self, cast

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone
from django.utils.translation import get_language, pgettext_lazy
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager, TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields

from utils.fields import LinesArrayField
from utils.models import DescriptiveModel, TimestampedModel
from work.choices import Icons


class TechnologyTerm(TranslatableModel, TimestampedModel):
    """
    A general term in the roles' technologies or the projects' tags, such as
    Microservices, with its word in each language. Proper names (Python,
    gRPC) read the same in every language and need no term.
    """

    name = models.CharField(
        _("Name"),
        max_length=128,
        help_text=_(
            "A term as it is written in a role's technologies or a project's tags; shown as this label in each "
            "language. Terms not listed are shown as written."
        ),
    )

    translations = TranslatedFields(
        label=models.CharField(_("Label"), max_length=128),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = _("Technology term")
        verbose_name_plural = _("Technology terms")
        ordering = (Lower("name"),)
        constraints = [
            # Matched ignoring case, so two spellings of one term would leave which label shows to chance.
            models.UniqueConstraint(
                Lower("name"),
                name="technology_term_name_unique_ignoring_case",
                violation_error_message=_("A term with this name already exists."),
            )
        ]


class TermLabels:
    """Every term's label in each language, read in one query, to show a list of terms in a language."""

    def __init__(self, labels: dict[str, dict[str, str]]) -> None:
        # By the term's name in lower case, then by language.
        self._labels = labels

    @classmethod
    def load(cls) -> "TermLabels":
        labels: dict[str, dict[str, str]] = {}
        rows = TechnologyTerm.objects.values_list("name", "translations__language_code", "translations__label")
        for name, language, label in rows:
            if language and label:
                labels.setdefault(name.lower(), {})[language] = label
        return cls(labels)

    def label(self, term: str, language: str) -> str:
        """The term's label in the language, else in another one, else the term as written."""
        labels = self._labels.get(term.lower(), {})
        if language in labels:
            return labels[language]
        return next((labels[code] for code, _name in settings.LANGUAGES if code in labels), term)

    def in_language(self, terms: Iterable[str] | None, language: str) -> list[str]:
        return [self.label(term, language) for term in terms or []]

    def display(self, terms: Iterable[str] | None) -> dict[str, list[str]]:
        """The list in every language the site has."""
        terms = list(terms or [])
        return {code: self.in_language(terms, code) for code, _name in settings.LANGUAGES}


class TermsQuerySet(TranslatableQuerySet):
    """
    Rows that show terms. With `with_terms`, the rows a query returns share
    one read of every term's labels, however many there are; a row read
    another way reads them itself when first asked.
    """

    reads_terms = False

    def with_terms(self) -> Self:
        clone = self._chain()
        clone.reads_terms = True
        return clone

    def _clone(self) -> Self:
        clone = super()._clone()
        clone.reads_terms = self.reads_terms
        return clone

    def _fetch_all(self) -> None:
        # Django calls this on every look at the rows; the terms are read with the rows, once.
        fetched = self._result_cache is not None
        super()._fetch_all()
        if self.reads_terms and not fetched and self._result_cache:
            labels = TermLabels.load()
            for row in self._result_cache:
                if isinstance(row, ShowsTerms):
                    row.term_labels = labels


class ShowsTerms:
    """A model whose lists hold terms, shown in each language through their labels."""

    @cached_property
    def term_labels(self) -> TermLabels:
        return TermLabels.load()


# The type checker cannot build `skills` from Skill's manager, which is parler's and untyped.
class SkillCategory(TranslatableModel, TimestampedModel):  # type: ignore[django-manager-missing]
    """A group the site shows skills in, such as the languages and frameworks, in its order."""

    order = models.PositiveSmallIntegerField(_("Order"), default=0, db_default=0)

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=128),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    def __str__(self) -> str:
        return self.safe_translation_getter("name", any_language=True) or f"{self.pk}"

    class Meta:
        verbose_name = _("Skill category")
        verbose_name_plural = _("Skill categories")
        ordering = ("order", "pk")


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
    # Each has a default in the database too (no category, place 0, an empty list), so the release before this one
    # can still add a skill.
    category = models.ForeignKey(
        SkillCategory,
        verbose_name=_("Category"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="skills",
        help_text=_("The group the site shows it in; without one it is shown after every group."),
    )
    order = models.PositiveSmallIntegerField(
        _("Order"), default=0, db_default=0, help_text=_("Its place within its category.")
    )
    proven_by = LinesArrayField(
        models.CharField(max_length=128),
        verbose_name=_("Proven by"),
        default=list,
        blank=True,
        db_default=[],
        help_text=_("A role's technology or tool, or a project's tag, that shows this skill; compared ignoring case."),
    )

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=128),
        description=models.TextField(_("Description"), null=True, blank=True),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    @classmethod
    def vex_queryset(cls) -> "models.QuerySet[Skill]":
        """Every skill, with its category's name at hand for the representation."""
        return cls.objects.select_related("category").prefetch_related("category__translations")

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        name = self.safe_translation_getter("name", language_code=lang, any_language=True) or ""
        description = self.safe_translation_getter("description", language_code=lang, any_language=True) or ""
        lines = [f"Skill: {name}"]
        if self.category is not None:
            category = self.category.safe_translation_getter("name", language_code=lang, any_language=True)
            lines.append(f"Category: {category or ''}")
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


class ProjectManager(TranslatableManager):
    _queryset_class = TermsQuerySet

    def with_terms(self) -> TermsQuerySet:
        return cast(TermsQuerySet, self.get_queryset()).with_terms()


class Project(TranslatableModel, TimestampedModel, DescriptiveModel, ShowsTerms):
    title = models.CharField(_("Title"), max_length=128)
    image = models.URLField(_("Image URL"), null=True, blank=True)
    tags = ArrayField(models.CharField(_("Tags"), max_length=128), null=True, blank=True)
    demo = models.URLField(_("Demo"), null=True, blank=True)
    repository = models.URLField(_("Repository"), null=True, blank=True)
    mobile = models.BooleanField(
        _("Mobile"),
        default=False,
        # In the database too, so the release before this one can still add a project.
        db_default=False,
        help_text=_("A phone app: the site shows it in a phone rather than a browser window."),
    )

    translations = TranslatedFields(
        description=models.TextField(_("Description"), null=True, blank=True),
        vex_question=models.CharField(
            _("Vex question"),
            max_length=255,
            blank=True,
            db_default="",
            help_text=_("What the Ask Vex button offers to ask about this item. Leave empty for a general question."),
        ),
    )

    # Managers
    objects: ProjectManager = ProjectManager()

    @property
    def tags_display(self) -> dict[str, list[str]]:
        """The tags in each language, a general term by its label there."""
        return self.term_labels.display(self.tags)

    @classmethod
    def vex_queryset(cls) -> TermsQuerySet:
        return cls.objects.with_terms()

    def representation_for(self, locale: str | None) -> str:
        lang = (locale or get_language() or "").split("-")[0][:2]
        description = self.safe_translation_getter("description", language_code=lang, any_language=True) or ""
        tags = ", ".join(self.term_labels.in_language(self.tags, lang))
        return (
            f"Project: {self.title}\nTags: {tags}\nDescription: {description}\n"
            f"Demo: {self.demo or ''}\nRepository: {self.repository or ''}"
        )

    class Meta:
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")


class ExperienceQuerySet(TermsQuerySet):
    def visible(self) -> "ExperienceQuerySet":
        """The roles shown on the site and given to Vex; a hidden one is kept but not shown."""
        return self.filter(visible=True)


class ExperienceManager(TranslatableManager):
    # Where parler's manager (built with Manager.from_queryset) takes its queryset.
    _queryset_class = ExperienceQuerySet

    def visible(self) -> ExperienceQuerySet:
        return cast(ExperienceQuerySet, self.get_queryset()).visible()


class Experience(TranslatableModel, TimestampedModel, DescriptiveModel, ShowsTerms):
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
            help_text=_("What the Ask Vex button offers to ask about this item. Leave empty for a general question."),
        ),
    )

    # Managers
    objects: ExperienceManager = ExperienceManager()

    @property
    def period(self) -> str:
        return f"{self.start.year} - {self.end.year if self.end is not None else ''}"

    @property
    def technologies_display(self) -> dict[str, list[str]]:
        """The technologies in each language, a general term by its label there."""
        return self.term_labels.display(self.technologies)

    @classmethod
    def vex_queryset(cls) -> ExperienceQuerySet:
        """Hidden roles stay out of Vex's context, as they do off the site."""
        return cls.objects.visible().with_terms()

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
            ("Technologies", ", ".join(self.term_labels.in_language(self.technologies, lang))),
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
