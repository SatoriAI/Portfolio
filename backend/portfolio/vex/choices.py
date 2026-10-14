from django.db import models


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
