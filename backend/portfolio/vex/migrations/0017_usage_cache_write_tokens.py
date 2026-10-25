from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vex", "0016_conversation_last_activity"),
    ]

    operations = [
        migrations.AddField(
            model_name="usage",
            name="cache_write_tokens",
            field=models.PositiveIntegerField(db_default=0, verbose_name="Cache write tokens"),
        ),
    ]
