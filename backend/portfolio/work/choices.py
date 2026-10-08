from django.db import models


class Icons(models.TextChoices):  # pylint: disable=too-many-ancestors
    CODE = "Code", "Code"
    DATABASE = "Database", "Database"
    BRAIN = "Brain", "Brain"
    SERVER = "Server", "Server"
    CLOUD = "Cloud", "Cloud"
    CONTAINER = "Container", "Container"
    SPARKLES = "Sparkles", "Sparkles"
    BOXES = "Boxes", "Boxes"
