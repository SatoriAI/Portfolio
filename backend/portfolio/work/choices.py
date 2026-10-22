from django.db import models


class Icons(models.TextChoices):  # pylint: disable=too-many-ancestors
    """
    The icon a skill is drawn with: a technology's own mark, named as the
    frontend's config/techIcons names it, or an outline icon from Lucide for a
    practice no one brand stands for. The frontend draws a name it does not
    know as Code.
    """

    CODE = "Code", "Code"
    DATABASE = "Database", "Database"
    BRAIN = "Brain", "Brain"
    SERVER = "Server", "Server"
    CLOUD = "Cloud", "Cloud"
    CONTAINER = "Container", "Container"
    SPARKLES = "Sparkles", "Sparkles"
    BOXES = "Boxes", "Boxes"
    NETWORK = "Network", "Network"
    INFINITY = "Infinity", "Infinity"
    # Brand marks.
    PYTHON = "Python", "Python"
    POSTGRESQL = "PostgreSQL", "PostgreSQL"
    DOCKER = "Docker", "Docker"
    KUBERNETES = "Kubernetes", "Kubernetes"
    REACT = "React", "React"
    CLAUDE = "Claude", "Claude"
    CURSOR = "Cursor", "Cursor"
    REDIS = "Redis", "Redis"
    GO = "Go", "Go"
