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
        return f"{_("Conversation")}: {self.session}"

    class Meta:
        verbose_name = _("Conversation")
        verbose_name_plural = _("Conversations")


class Message(TimestampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(_("Role"), choices=Roles, max_length=16)
    content = models.TextField(_("Content"))

    class Meta:
        verbose_name = _("Message")
        verbose_name_plural = _("Messages")


class Document(TimestampedModel):
    title = models.CharField(_("Title"), max_length=256)
    description = models.TextField(_("Description"), null=True, blank=True)
    language = models.CharField(_("Language"), choices=settings.LANGUAGES, default=settings.LANGUAGE_CODE, max_length=2)

    file = models.FileField(_("File"), upload_to="vex_docs/", null=True, blank=True)
    url = models.URLField(_("Source URL"), null=True, blank=True)

    injected = models.BooleanField(_("Injected"), default=False)

    def mark_as_injected(self) -> None:
        self.injected = True
        self.save()

    def __str__(self) -> str:
        return f"Document: {self.title}"

    class Meta:
        verbose_name = _("Document")
        verbose_name_plural = _("Documents")


class Configuration(TranslatableModel, TimestampedModel):
    translations = TranslatedFields(
        title=models.CharField(_("Title"), max_length=256),
        system_prompt=models.TextField(_("System Prompt")),
        user_prompt=models.TextField(_("User Prompt")),
    )
    model = models.CharField(_("Model"), max_length=256)
    temperature = models.FloatField(_("Temperature"), default=0.5)

    # Managers
    objects: TranslatableManager = TranslatableManager()

    class Meta:
        verbose_name = _("Configuration")
        verbose_name_plural = _("Configurations")
