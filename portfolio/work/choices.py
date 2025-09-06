from django.db import models
from django.utils.translation import gettext_lazy as _


class Levels(models.TextChoices):  # pylint: disable=too-many-ancestors
    INTERMEDIATE = "3+ years of experience", _("3+ years of experience")
    ADVANCED = "5+ years of experience", _("5+ years of experience")
    EXPERT = "10+ years of experience", _("10+ years of experience")
