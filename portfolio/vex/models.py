from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.models import TimestampedModel
from vex.choices import Roles


class Conversation(TimestampedModel):
    session = models.CharField(_("Session Key"), max_length=64, db_index=True)
    title = models.CharField(_("Title"), max_length=256, null=True, blank=True)

    def __str__(self) -> str:
        return f"Conversation: {self.title or self.session}"

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
