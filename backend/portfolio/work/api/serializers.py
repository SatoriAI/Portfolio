from parler_rest.fields import TranslatedFieldsField
from parler_rest.serializers import TranslatableModelSerializer

from work.models import Experience, Project, Skill, SkillCategory


class SkillCategorySerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=SkillCategory)

    class Meta:
        model = SkillCategory
        fields = ("id", "order", "translations")


class SkillSerializer(TranslatableModelSerializer):
    translations = TranslatedFieldsField(shared_model=Skill)
    category = SkillCategorySerializer(read_only=True, allow_null=True)

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
        # Only visible roles are listed, so the flag would always read true.
        exclude = ("visible",)
