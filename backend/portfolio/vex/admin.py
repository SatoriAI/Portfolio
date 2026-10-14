from typing import Any

from django import forms
from django.conf import settings
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest, HttpResponse
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from vex.ai import spend
from vex.models import Configuration, Conversation, Document, Message, Usage
from vex.utils.document_text import UnreadableDocument, extract_text


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
        "feedback",
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


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Read-only, like the conversations it belongs to: the place to see how visitors rated Vex's answers."""

    list_display = (
        "created_at",
        "role",
        "short_content",
        "feedback",
        "model",
        "prompt_version",
    )
    list_filter = ("feedback", "role", "model", "prompt_version")
    search_fields = ("content", "conversation__session")
    date_hierarchy = "created_at"

    @admin.display(description=_("Content"))
    def short_content(self, obj: Message) -> str:
        return obj.content if len(obj.content) <= 80 else f"{obj.content[:79]}…"

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: Message | None = None) -> bool:
        return False


class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = "__all__"

    def clean(self) -> dict[str, Any]:
        """A newly uploaded file replaces the text Vex reads, unless that text was edited in the same save. The file
        is read here, from the upload, so one with no text to read is a form error rather than a saved document Vex
        knows nothing of."""
        super().clean()
        upload = self.cleaned_data.get("file")
        if upload and "file" in self.changed_data and "content" not in self.changed_data:
            try:
                self.cleaned_data["content"] = extract_text(upload.name, upload.read())
            except UnreadableDocument:
                self.add_error(
                    "file",
                    _("No text could be read from this file. Paste its text into Content, or upload another file."),
                )
        return self.cleaned_data


class HasTextFilter(admin.SimpleListFilter):
    title = _("Text for Vex")
    parameter_name = "has_text"

    def lookups(self, request: HttpRequest, model_admin: admin.ModelAdmin) -> list[tuple[str, Any]]:
        return [("yes", _("Has text")), ("no", _("Empty"))]

    def queryset(self, request: HttpRequest, queryset: QuerySet[Document]) -> QuerySet[Document]:
        if self.value() == "yes":
            return queryset.exclude(content="")
        if self.value() == "no":
            return queryset.filter(content="")
        return queryset


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    form = DocumentForm
    list_display = (
        "title",
        "language",
        "has_text",
        "created_at",
    )
    list_filter = (HasTextFilter, "language")
    search_fields = (
        "title",
        "description",
        "content",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )

    @admin.display(description=_("Text for Vex"), boolean=True)
    def has_text(self, obj: Document) -> bool:
        return bool(obj.content)


@admin.register(Usage)
class UsageAdmin(admin.ModelAdmin):
    """Read-only: each row is a call already paid for."""

    list_display = (
        "created_at",
        "model",
        "outcome",
        "finish_reason",
        "input_tokens",
        "cached_tokens",
        "output_tokens",
        "reasoning_tokens",
        "estimated",
        "cost",
    )
    list_filter = ("outcome", "model", "estimated")
    date_hierarchy = "created_at"

    def changelist_view(self, request: HttpRequest, extra_context: dict[str, Any] | None = None) -> HttpResponse:
        """Heads the list with today's spend against the budget, as the table adds it up."""
        today = spend.day_spend(spend.today())
        subtitle = _("Today (UTC): $%(spent).4f of $%(budget)s, %(calls)d calls, %(cached).0f%% of input cached") % {
            "spent": today.dollars,
            "budget": settings.VEX_DAILY_BUDGET_USD,
            "calls": today.calls,
            "cached": today.cached_share * 100,
        }
        return super().changelist_view(request, {**(extra_context or {}), "subtitle": subtitle})

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: Usage | None = None) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj: Usage | None = None) -> bool:
        return False


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
