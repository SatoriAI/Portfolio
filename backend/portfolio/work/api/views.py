from django.db.models import Case, F, IntegerField, Value, When
from drf_spectacular.utils import extend_schema
from rest_framework import generics

from work.api.serializers import ExperienceSerializer, ProjectSerializer, SkillSerializer
from work.models import Experience, Project, Skill


@extend_schema(summary="List Skills", tags=["Work"])
class SkillViewSet(generics.ListAPIView):
    # Grouped as the site shows them: by category (two with one order kept apart by id), then by each skill's place
    # in it; a skill in no category comes last.
    queryset = (
        Skill.objects.select_related("category")
        .prefetch_related("translations", "category__translations")
        .order_by(F("category__order").asc(nulls_last=True), "category_id", "order", "pk")
    )
    serializer_class = SkillSerializer


@extend_schema(summary="List Projects", tags=["Work"])
class ProjectViewSet(generics.ListAPIView):
    queryset = Project.objects.all().prefetch_related("translations")
    serializer_class = ProjectSerializer


@extend_schema(summary="List Experiences", tags=["Work"])
class ExperienceViewSet(generics.ListAPIView):
    queryset = (
        Experience.objects.visible()
        .annotate(
            is_current=Case(
                When(end__isnull=True, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        .prefetch_related("translations")
        .order_by("-is_current", "-start")
    )
    serializer_class = ExperienceSerializer
