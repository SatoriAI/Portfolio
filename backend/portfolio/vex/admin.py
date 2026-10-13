from django.contrib import admin
from django.forms import ModelForm
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from vex.models import Configuration, Conversation, Document, Message
from vex.utils.document_text import extract_text


class MessageInline(admin.TabularInline):
    model = Message
    fields = (
        "role",
        "content",
        "created_at",
        "model",
        "input_tokens",
        "cached_tokens",
        "output_tokens",
    )
    readonly_fields = fields
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
        "created_at",
    )
    search_fields = (
        "title",
        "description",
        "content",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )

    def save_model(self, request: HttpRequest, obj: Document, form: ModelForm, change: bool) -> None:
        super().save_model(request, obj, form, change)
        # A newly uploaded file replaces the text Vex reads, unless that text was edited in the same save.
        if obj.file and "file" in form.changed_data and "content" not in form.changed_data:
            with obj.file.open("rb") as file:
                obj.content = extract_text(obj.file.name, file.read())
            obj.save(update_fields=["content", "updated_at"])


@admin.register(Configuration)
class ConfigurationAdmin(TranslatableAdmin):
    list_display = (
        "title",
        "updated_at",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
