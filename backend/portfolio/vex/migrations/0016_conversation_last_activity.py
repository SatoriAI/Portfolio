"""Moves each conversation's updated_at to its newest message, where that is later.

Retention (vex.retention) deletes a conversation once its updated_at is older than VEX_CONVERSATION_RETENTION_DAYS,
and from now on every question touches it. Before, nothing did: messages were created beside the conversation, so
updated_at stayed where the conversation's creation left it, and a conversation still in use would read as old."""

from django.db import migrations
from django.db.models import F, Max, OuterRef, Subquery


def backfill(apps, schema_editor) -> None:
    Conversation = apps.get_model("vex", "Conversation")
    Message = apps.get_model("vex", "Message")
    newest = (
        Message.objects.filter(conversation=OuterRef("pk"))
        .values("conversation")
        .annotate(newest=Max("created_at"))
        .values("newest")
    )
    Conversation.objects.annotate(newest=Subquery(newest)).filter(newest__gt=F("updated_at")).update(
        updated_at=Subquery(newest)
    )


class Migration(migrations.Migration):
    dependencies = [
        ("vex", "0015_message_truncated"),
    ]

    # Nothing to undo: the old values said less than these.
    operations = [
        migrations.RunPython(backfill, reverse_code=migrations.RunPython.noop),
    ]
