from django.db.models import Case, IntegerField, Value, When
from drf_spectacular.utils import extend_schema
from rest_framework import generics

from work.api.serializers import ExperienceSerializer, ProjectSerializer, SkillSerializer
from work.models import Experience, Project, Skill


@extend_schema(summary="List Skills", tags=["Work"])
class SkillViewSet(generics.ListAPIView):
    queryset = Skill.objects.all().prefetch_related("translations").order_by("pk")
    serializer_class = SkillSerializer


@extend_schema(summary="List Projects", tags=["Work"])
class ProjectViewSet(generics.ListAPIView):
    queryset = Project.objects.all().prefetch_related("translations")
    serializer_class = ProjectSerializer


@extend_schema(summary="List Experiences", tags=["Work"])
class ExperienceViewSet(generics.ListAPIView):
    queryset = (
        Experience.objects.all()
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
