from django.db import migrations

# The projects that are phone apps when the field arrives, so production
# shows them in a phone from the first deploy instead of waiting for the
# admin; a new one is marked there.
PHONE_APPS = ("Slip",)


def mark(apps, schema_editor):
    Project = apps.get_model("work", "Project")
    Project.objects.filter(title__in=PHONE_APPS).update(mobile=True)


class Migration(migrations.Migration):
    dependencies = [
        ("work", "0011_project_mobile"),
    ]

    operations = [
        # Going back leaves them marked: the field goes with 0011 anyway.
        migrations.RunPython(mark, migrations.RunPython.noop),
    ]
