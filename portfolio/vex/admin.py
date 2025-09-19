from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from vex.actions.inject_documents import run_inject_documents
from vex.models import Conversation, Document, Message


class MessageInline(admin.TabularInline):
    model = Message
    fields = (
        "role",
        "content",
        "created_at",
    )
    readonly_fields = (
        "role",
        "content",
        "created_at",
    )
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "session",
        "number_of_messages",
        "created_at",
    )
    search_fields = ("session",)
    readonly_fields = (
        "session",
        "created_at",
        "updated_at",
    )
    inlines = [
        MessageInline,
    ]

    @admin.display(description=_("Number of Messages"))
    def number_of_messages(self, obj: Conversation) -> int:
        return obj.messages.count()


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "language",
        "injected",
        "created_at",
    )
    search_fields = (
        "title",
        "description",
    )
    readonly_fields = (
        "injected",
        "created_at",
        "updated_at",
    )

    actions = [
        run_inject_documents,
    ]
