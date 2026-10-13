from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager
from parler.models import TranslatableModel, TranslatedFields

from utils.models import TimestampedModel
from vex.choices import Roles


class Conversation(TimestampedModel):
    session = models.CharField(_("Session Key"), max_length=64, db_index=True)

    def __str__(self) -> str:
        return f"{_('Conversation')}: {self.session}"

    class Meta:
        verbose_name = _("Conversation")
        verbose_name_plural = _("Conversations")


class Message(TimestampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(_("Role"), choices=Roles, max_length=16)
    content = models.TextField(_("Content"))

    # What an answer cost and what produced it, so two answers can be compared and a day's spend added up. Empty on
    # a question, and on answers given before these were kept.
    model = models.CharField(_("Model"), max_length=64, blank=True, db_default="")
    prompt_version = models.CharField(_("Prompt version"), max_length=32, blank=True, db_default="")
    input_tokens = models.PositiveIntegerField(_("Input tokens"), null=True, blank=True)
    cached_tokens = models.PositiveIntegerField(_("Cached input tokens"), null=True, blank=True)
    output_tokens = models.PositiveIntegerField(_("Output tokens"), null=True, blank=True)

    class Meta:
        verbose_name = _("Message")
        verbose_name_plural = _("Messages")


class Document(TimestampedModel):
    title = models.CharField(_("Title"), max_length=256)
    description = models.TextField(_("Description"), null=True, blank=True)
    language = models.CharField(_("Language"), choices=settings.LANGUAGES, default=settings.LANGUAGE_CODE, max_length=2)

    file = models.FileField(_("File"), upload_to="vex_docs/", null=True, blank=True)
    url = models.URLField(_("Source URL"), null=True, blank=True)

    content = models.TextField(
        _("Content"),
        blank=True,
        db_default="",
        help_text=_("The text Vex reads. Filled from the file when one is uploaded; edit it freely."),
    )

    def __str__(self) -> str:
        return f"Document: {self.title}"

    class Meta:
        verbose_name = _("Document")
        verbose_name_plural = _("Documents")


class Configuration(TranslatableModel, TimestampedModel):
    translations = TranslatedFields(
        title=models.CharField(_("Title"), max_length=256),
        system_prompt=models.TextField(
            _("System Prompt"),
            help_text=_(
                "Vex's persona: its tone and style. Read with the rules in code, which win where they disagree."
            ),
        ),
        user_prompt=models.TextField(
            _("User Prompt"),
            help_text=_("No longer read: the question and the knowledge are put together in code. Kept for reference."),
        ),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("Configuration")
        verbose_name_plural = _("Configurations")
