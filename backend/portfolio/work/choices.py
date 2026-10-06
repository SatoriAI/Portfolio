from django.db import models
from django.utils.translation import gettext_lazy as _


class Levels(models.TextChoices):  # pylint: disable=too-many-ancestors
    INTERMEDIATE = "3+ years of experience", _("3+ years of experience")
    ADVANCED = "5+ years of experience", _("5+ years of experience")
    EXPERT = "10+ years of experience", _("10+ years of experience")
    # For a tool younger than the shortest count: used since it came out.
    SINCE_LAUNCH = "Since launch", _("Since launch")


class Icons(models.TextChoices):  # pylint: disable=too-many-ancestors
    CODE = "Code", "Code"
    DATABASE = "Database", "Database"
    BRAIN = "Brain", "Brain"
    SERVER = "Server", "Server"
    CLOUD = "Cloud", "Cloud"
    CONTAINER = "Container", "Container"
    SPARKLES = "Sparkles", "Sparkles"
    BOXES = "Boxes", "Boxes"
