from django.utils import translation
from parler_rest.fields import TranslatedFieldsField
from parler_rest.serializers import TranslatableModelSerializer
from rest_framework import serializers

from university.models import Publication, School, Testimonial


class SchoolSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=School)
    degree = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = "__all__"

    def get_degree(self, obj) -> str:
        with translation.override(self.context.get("request").LANGUAGE_CODE):
            return obj.get_degree_display()


class PublicationSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Publication)

    class Meta:
        model = Publication
        fields = "__all__"


class TestimonialSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Testimonial)
    season = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = "__all__"

    def get_season(self, obj) -> str:
        with translation.override(self.context.get("request").LANGUAGE_CODE):
            return obj.get_season_display()
