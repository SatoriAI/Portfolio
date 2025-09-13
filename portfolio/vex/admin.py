from django.contrib import admin

from vex.models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    fields = (
        "role",
        "content",
        "created_at",
    )
    readonly_fields = ("created_at",)
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "session",
        "created_at",
    )
    search_fields = (
        "title",
        "session",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    inlines = [
        MessageInline,
    ]
