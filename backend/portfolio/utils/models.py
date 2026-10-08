from typing import Any

from django.db import models
from django.utils.translation import gettext_lazy as _


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        abstract = True


class DescriptiveModel:
    """A model Vex can read: how one row reads, and which rows it may read."""

    def representation_for(self, locale: str | None) -> str:
        raise NotImplementedError

    @classmethod
    def vex_queryset(cls) -> "models.QuerySet[Any]":
        """The rows Vex may read; a model that hides some narrows this."""
        # A mixin of models, so the manager is the model's. pylint: disable=no-member
        return cls._default_manager.all()  # type: ignore[attr-defined]
