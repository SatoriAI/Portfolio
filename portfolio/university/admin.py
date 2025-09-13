from django.contrib import admin
from parler.admin import TranslatableAdmin

from university.models import Publication, School, Testimonial


@admin.register(School)
class SchoolAdmin(TranslatableAdmin):
    list_display = (
        "study",
        "university",
        "advisor",
    )


@admin.register(Publication)
class PublicationAdmin(TranslatableAdmin):
    list_display = (
        "title",
        "journal",
    )


@admin.register(Testimonial)
class TestimonialAdmin(TranslatableAdmin):
    list_display = (
        "course",
        "semester",
    )
