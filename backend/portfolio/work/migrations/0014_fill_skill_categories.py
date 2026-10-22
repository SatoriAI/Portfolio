from django.db import migrations

# What the frontend kept in its own code until now, keyed by the skill's id
# (work/content.py keeps the same skill on the same id in every database): the
# groups with their names, each group's skills in order, the technologies that
# prove a skill, and the icon it is drawn with. A skill missing here is skipped.
CATEGORIES = (
    ("Languages and frameworks", "Języki i frameworki", (9, 1, 13)),
    ("Databases and architecture", "Bazy danych i architektura", (2, 12, 4)),
    ("Infrastructure and deployment", "Infrastruktura i wdrażanie", (3, 6, 8, 7)),
    ("AI and tools", "AI i narzędzia", (5, 10, 11)),
)
PROVEN_BY = {
    1: ["Python", "FastAPI", "Django"],
    2: ["PostgreSQL"],
    3: ["Docker"],
    4: ["Microservices"],
    5: ["GenAI"],
    6: ["Kubernetes"],
    7: ["CI", "CI/CD"],
    8: ["AWS", "OpenStack", "Google Cloud"],
    9: ["React"],
    10: ["Claude Code"],
    11: ["Cursor"],
    12: ["Redis"],
    13: ["Go"],
}
ICONS = {
    1: "Python",
    2: "PostgreSQL",
    3: "Docker",
    4: "Network",
    5: "Sparkles",
    6: "Kubernetes",
    7: "Infinity",
    8: "Cloud",
    9: "React",
    10: "Claude",
    11: "Cursor",
    12: "Redis",
    13: "Go",
}


def fill(apps, schema_editor):
    Skill = apps.get_model("work", "Skill")
    # A new database (or a test's) has no skills, and gets no categories either.
    if not Skill.objects.exists():
        return
    SkillCategory = apps.get_model("work", "SkillCategory")
    SkillCategoryTranslation = apps.get_model("work", "SkillCategoryTranslation")
    for order, (en, pl, pks) in enumerate(CATEGORIES):
        category = SkillCategory.objects.create(order=order)
        SkillCategoryTranslation.objects.bulk_create(
            [
                SkillCategoryTranslation(master=category, language_code="en", name=en),
                SkillCategoryTranslation(master=category, language_code="pl", name=pl),
            ]
        )
        for position, pk in enumerate(pks):
            Skill.objects.filter(pk=pk).update(category=category, order=position)
    for pk, technologies in PROVEN_BY.items():
        Skill.objects.filter(pk=pk).update(proven_by=technologies)
    for pk, icon in ICONS.items():
        Skill.objects.filter(pk=pk).update(icon=icon)


class Migration(migrations.Migration):
    dependencies = [
        ("work", "0013_skill_category"),
    ]

    operations = [
        # Going back leaves the values: the fields go with 0013 anyway.
        migrations.RunPython(fill, migrations.RunPython.noop),
    ]
