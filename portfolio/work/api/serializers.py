from parler_rest.fields import TranslatedFieldsField
from parler_rest.serializers import TranslatableModelSerializer

from work.models import Experience, Project, Skill


class SkillSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Skill)

    class Meta:
        model = Skill
        fields = "__all__"


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
