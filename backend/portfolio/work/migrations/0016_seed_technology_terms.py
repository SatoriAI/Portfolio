from django.db import migrations

# The general terms the roles and projects already use, with their word in each language. Proper names need none.
TERMS = (("Microservices", {"en": "Microservices", "pl": "Mikroserwisy"}),)


def seed(apps, schema_editor):
    Experience = apps.get_model("work", "Experience")
    Project = apps.get_model("work", "Project")
    # A new database (or a test's) has no roles or projects to show a term in.
    if not Experience.objects.exists() and not Project.objects.exists():
        return
    TechnologyTerm = apps.get_model("work", "TechnologyTerm")
    TechnologyTermTranslation = apps.get_model("work", "TechnologyTermTranslation")
    for name, labels in TERMS:
        # Added already, here on an earlier run or in the admin: its labels may have been edited since.
        if TechnologyTerm.objects.filter(name__iexact=name).exists():
            continue
        term = TechnologyTerm.objects.create(name=name)
        TechnologyTermTranslation.objects.bulk_create(
            TechnologyTermTranslation(master=term, language_code=language, label=label)
            for language, label in labels.items()
        )


class Migration(migrations.Migration):
    dependencies = [
        ("work", "0015_technology_term"),
    ]

    operations = [
        # Going back leaves the term: the table goes with 0015 anyway.
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]
