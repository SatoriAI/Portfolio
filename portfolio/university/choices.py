from django.db import models
from django.utils.translation import gettext_lazy as _


class Seasons(models.TextChoices):  # pylint: disable=too-many-ancestors
    WINTER = "Winter", _("Winter")
    SUMMER = "Summer", _("Summer")


class Degrees(models.TextChoices):  # pylint: disable=too-many-ancestors
    BACHELOR = "Bachelor's", _("Bachelor's")
    MASTER = "Master's", _("Master's")
    DOCTORATE = "Doctoral Studies", _("Doctoral Studies")
