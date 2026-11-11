from django.db import models
from django.utils.translation import gettext_lazy as _


class Roles(models.TextChoices):  # pylint: disable=too-many-ancestors
    USER = "user", "user"
    ASSISTANT = "assistant", "assistant"
    SYSTEM = "system", "system"


class Outcomes(models.TextChoices):  # pylint: disable=too-many-ancestors
    """How a call to the model ended. Every one of them is billed."""

    ANSWERED = "answered", "answered"
    EMPTY = "empty", "empty"
    ABANDONED = "abandoned", "abandoned"
    FAILED = "failed", "failed"


class Purposes(models.TextChoices):  # pylint: disable=too-many-ancestors
    """What a call to the model was for: a visitor's answer, or a conversation's summary written for the admin."""

    ANSWER = "answer", "answer"
    SUMMARY = "summary", "summary"


class Feedback(models.TextChoices):  # pylint: disable=too-many-ancestors
    """A visitor's rating of one answer. An unrated answer stores the empty string."""

    UP = "up", _("Helpful")
    DOWN = "down", _("Not helpful")
