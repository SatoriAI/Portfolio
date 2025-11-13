from django.db import models


class Roles(models.TextChoices):  # pylint: disable=too-many-ancestors
    USER = "user", "user"
    ASSISTANT = "assistant", "assistant"
    SYSTEM = "system", "system"
