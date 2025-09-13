from django.db import models


class Roles(models.TextChoices):
    USER = "user", "user"
    ASSISTANT = "assistant", "assistant"
    SYSTEM = "system", "system"
