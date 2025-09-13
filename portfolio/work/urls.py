from django.urls import path

from work.api.views import ExperienceViewSet, ProjectViewSet, SkillViewSet

app_name = "work"

urlpatterns = [
    path("skills/", SkillViewSet.as_view(), name="skills"),
    path("projects/", ProjectViewSet.as_view(), name="projects"),
    path("experiences/", ExperienceViewSet.as_view(), name="experiences"),
]
