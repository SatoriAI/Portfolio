# Adds icon choices so that no two skills have to share a glyph. Choices only:
# existing rows keep their values and no data is rewritten.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("work", "0005_remove_skill_image_skill_icon"),
    ]

    operations = [
        migrations.AlterField(
            model_name="skill",
            name="icon",
            field=models.CharField(
                choices=[
                    ("Code", "Code"),
                    ("Database", "Database"),
                    ("Brain", "Brain"),
                    ("Server", "Server"),
                    ("Cloud", "Cloud"),
                    ("Container", "Container"),
                    ("Sparkles", "Sparkles"),
                    ("Boxes", "Boxes"),
                ],
                default="Code",
                max_length=16,
            ),
        ),
    ]
