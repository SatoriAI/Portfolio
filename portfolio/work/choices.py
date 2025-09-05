from django.db import models
from django.utils.translation import gettext_lazy as _


class Levels(models.TextChoices):  # pylint: disable=too-many-ancestors
    INTERMEDIATE = "Intermediate", _("Intermediate")
    ADVANCED = "Advanced", _("Advanced")
    EXPERT = "Expert", _("Expert")
