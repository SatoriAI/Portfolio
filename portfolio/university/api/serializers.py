from parler_rest.fields import TranslatedFieldsField
from parler_rest.serializers import TranslatableModelSerializer

from university.models import Publication, School, Testimonial


class SchoolSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=School)

    class Meta:
        model = School
        fields = "__all__"


class PublicationSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Publication)

    class Meta:
        model = Publication
        fields = "__all__"


class TestimonialSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Testimonial)

    class Meta:
        model = Testimonial
        fields = "__all__"
