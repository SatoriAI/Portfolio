from django.utils import translation
from parler_rest.fields import TranslatedFieldsField
from parler_rest.serializers import TranslatableModelSerializer
from rest_framework import serializers

from work.models import Experience, Project, Skill


class SkillSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Skill)
    level = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = "__all__"

    def get_level(self, obj: Skill) -> str:
        with translation.override(self.context.get("request").LANGUAGE_CODE):
            return obj.get_level_display()


class ProjectSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Project)

    class Meta:
        model = Project
        fields = "__all__"


class ExperienceSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Experience)

    class Meta:
        model = Experience
        fields = "__all__"
