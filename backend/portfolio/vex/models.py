from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableManager
from parler.models import TranslatableModel, TranslatedFields

from utils.models import TimestampedModel
from vex.choices import Feedback, Outcomes, Roles


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
    # On a question asked from a role or a project: where, as the model read it beside the question (see
    # vex.ai.context), so it reads the same in the history of later turns. Empty on every other message.
    asked_from = models.TextField(_("Asked from"), blank=True, db_default="")

    # What an answer cost and what produced it, so two answers can be compared. Empty on a question, and on answers
    # given before these were kept. A day's spend is added up from Usage, which also holds the calls with no answer.
    model = models.CharField(_("Model"), max_length=64, blank=True, db_default="")
    prompt_version = models.CharField(_("Prompt version"), max_length=32, blank=True, db_default="")
    input_tokens = models.PositiveIntegerField(_("Input tokens"), null=True, blank=True)
    cached_tokens = models.PositiveIntegerField(_("Cached input tokens"), null=True, blank=True)
    output_tokens = models.PositiveIntegerField(_("Output tokens"), null=True, blank=True)
    # The visitor's thumbs up or down on an answer, empty until rated (or once the rating is taken back).
    feedback = models.CharField(_("Feedback"), choices=Feedback, max_length=4, blank=True, db_default="")

    class Meta:
        verbose_name = _("Message")
        verbose_name_plural = _("Messages")


class Usage(models.Model):
    """One call to the model and what it cost, whether or not it ended in a saved answer: a visitor who leaves, a
    provider that fails mid-answer and an answer with no text are all billed, and none of them leaves a Message.

    Where the provider never reported the counts (the stream ended before its last chunk), they are estimated from
    the text sent and received, and marked so; reasoning tokens are then unknown and left at zero."""

    created_at = models.DateTimeField(_("Created At"), auto_now_add=True, db_index=True)
    # Kept when the conversation is deleted: the money was spent all the same.
    conversation = models.ForeignKey(
        Conversation, on_delete=models.SET_NULL, null=True, blank=True, related_name="usage"
    )
    model = models.CharField(_("Model"), max_length=64)
    prompt_version = models.CharField(_("Prompt version"), max_length=32)
    outcome = models.CharField(_("Outcome"), choices=Outcomes, max_length=16)
    finish_reason = models.CharField(_("Finish reason"), max_length=32, blank=True)
    input_tokens = models.PositiveIntegerField(_("Input tokens"))
    cached_tokens = models.PositiveIntegerField(_("Cached input tokens"))
    output_tokens = models.PositiveIntegerField(_("Output tokens"))
    reasoning_tokens = models.PositiveIntegerField(_("Reasoning tokens"))
    estimated = models.BooleanField(_("Estimated"))
    # In dollars, at settings.VEX_PRICES; empty for a model with no price there.
    cost = models.DecimalField(_("Cost (USD)"), max_digits=12, decimal_places=8, null=True, blank=True)

    class Meta:
        verbose_name = _("Usage")
        verbose_name_plural = _("Usage")


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
                "Vex's persona: her tone and style. Read with the rules in code, which win where they disagree."
            ),
        ),
        user_prompt=models.TextField(
            _("User Prompt"),
            blank=True,
            help_text=_("No longer read: the question and the knowledge are put together in code. Kept for reference."),
        ),
    )

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("Configuration")
        verbose_name_plural = _("Configurations")
