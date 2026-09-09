from django.urls import path

from university.api.views import PublicationViewSet, SchoolViewSet, TestimonialViewSet

app_name = "university"

urlpatterns = [
    path("schools/", SchoolViewSet.as_view(), name="schools"),
    path("publications/", PublicationViewSet.as_view(), name="publications"),
    path("testimonials/", TestimonialViewSet.as_view(), name="testimonials"),
]
