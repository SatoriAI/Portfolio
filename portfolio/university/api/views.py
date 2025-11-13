from drf_spectacular.utils import extend_schema
from rest_framework import generics

from university.api.serializers import PublicationSerializer, SchoolSerializer, TestimonialSerializer
from university.models import Publication, School, Testimonial


@extend_schema(summary="List Schools", tags=["University"])
class SchoolViewSet(generics.ListAPIView):
    queryset = School.objects.all().prefetch_related("translations").order_by("-pk")
    serializer_class = SchoolSerializer


@extend_schema(summary="List Publications", tags=["University"])
class PublicationViewSet(generics.ListAPIView):
    queryset = Publication.objects.all().prefetch_related("translations").order_by("-year")
    serializer_class = PublicationSerializer


@extend_schema(summary="List Testimonials", tags=["University"])
class TestimonialViewSet(generics.ListAPIView):
    queryset = Testimonial.objects.all().prefetch_related("translations")
    serializer_class = TestimonialSerializer
