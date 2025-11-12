from django.db import models
from django.utils.translation import gettext_lazy as _


class Seasons(models.TextChoices):  # pylint: disable=too-many-ancestors
    WINTER = "Winter", _("Winter")
    SUMMER = "Summer", _("Summer")


class Degrees(models.TextChoices):  # pylint: disable=too-many-ancestors
    BACHELOR = "Bachelor Degree", _("Bachelor Degree")
    MASTER = "Master Degree", _("Master Degree")
    DOCTORATE = "Doctorate Degree", _("Doctorate Degree")
