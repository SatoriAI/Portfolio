import logging
from typing import TYPE_CHECKING, Any, TypedDict

from django import forms
from django.conf import settings
from django.contrib import admin, messages
from django.db.models import Count, OuterRef, QuerySet, Subquery, Sum
from django.http import HttpRequest, HttpResponse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from vex.ai import spend
from vex.ai.summary import Unsummarised, needing_summary, summarise
from vex.choices import Purposes, Roles
from vex.models import Configuration, Conversation, Document, Message, Usage
from vex.utils.document_text import UnreadableDocument, extract_text

logger = logging.getLogger(__name__)

# The About column on one line. A table cell grows to fit its text, so the cut needs a width of its own: two fifths of
# the window leaves room for the admin's sidebar and the other columns, on a laptop and in a narrow window.
ABOUT_STYLE = (
    "display: inline-block; max-width: 40vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; "
    "vertical-align: bottom"
)

if TYPE_CHECKING:
    from django_stubs_ext import WithAnnotations


class Listed(TypedDict):
    """What ConversationAdmin.get_queryset adds to each conversation."""

    message_count: int
    first_question: str | None


if TYPE_CHECKING:
    ListedConversation = WithAnnotations[Conversation, Listed]


class MessageInline(admin.TabularInline):
    model = Message
    fields = (
        "role",
        "content",
        "asked_from",
        "created_at",
        "model",
        "input_tokens",
        "cached_tokens",
        "output_tokens",
        "truncated",
        "feedback",
    )
    readonly_fields = fields
    extra = 0
    can_delete = False  # a message goes only with its conversation, and its visitor's rating with it

    def has_add_permission(self, request: HttpRequest, obj: Conversation | None = None) -> bool:
        """Messages come from Vex, not the admin. A blank row to add one would also be rendered from an unsaved
        message, whose db_default fields hold no value yet, and the read-only display of them fails."""
        return False


class UsageInline(admin.TabularInline):
    """Read-only: each row is a call already paid for, including the ones that left no message."""

    model = Usage
    fields = (
        "created_at",
        "purpose",
        "model",
        "outcome",
        "finish_reason",
        "input_tokens",
        "cached_tokens",
        "cache_write_tokens",
        "output_tokens",
        "reasoning_tokens",
        "estimated",
        "cost",
    )
    readonly_fields = fields
    ordering = ("created_at",)
    extra = 0
    can_delete = False

    def has_add_permission(self, request: HttpRequest, obj: Conversation | None = None) -> bool:
        return False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "about",
        "number_of_messages",
        "created_at",
    )
    search_fields = ("summary", "messages__content", "session")
    readonly_fields = (
        "summary",
        "summary_failed",
        "session",
        "total_cost",
        "created_at",
        "updated_at",
    )
    actions = ["summarise_conversations"]
    inlines = [
        MessageInline,
        UsageInline,
    ]

    # How many conversations one run of the action summarises: a call takes a few seconds, and the admin waits for
    # them all. The rest are left for the next run, which skips those already summarised.
    SUMMARISE_PER_RUN = 10

    def get_queryset(self, request: HttpRequest) -> QuerySet[Conversation]:
        first_question = (
            Message.objects.filter(conversation=OuterRef("pk"), role=Roles.USER)
            .order_by("created_at", "pk")
            .values("content")[:1]
        )
        return (
            super()
            .get_queryset(request)
            .annotate(message_count=Count("messages", distinct=True), first_question=Subquery(first_question))
        )

    @admin.display(description=_("About"))
    def about(self, obj: "ListedConversation") -> str:
        """The summary, marked when messages have come since; until there is one, the visitor's first question. On one
        line, cut with an ellipsis where it runs out of room, the whole of it on hover; the mark stays in sight."""
        text = obj.summary or " ".join((obj.first_question or "").split()) or obj.session
        behind = bool(obj.summary) and obj.summarised_messages != obj.message_count
        return format_html(
            '<span style="white-space: nowrap"><span title="{}" style="{}">{}</span>{}</span>',
            text,
            ABOUT_STYLE,
            text,
            " (+)" if behind else "",
        )

    @admin.display(description=_("Number of Messages"), ordering="message_count")
    def number_of_messages(self, obj: "ListedConversation") -> int:
        return obj.message_count

    @admin.display(description=_("Cost (USD)"))
    def total_cost(self, obj: Conversation) -> str:
        """What the visitor's answers cost; the summaries written in the admin are listed below, apart."""
        total = obj.usage.filter(purpose=Purposes.ANSWER).aggregate(total=Sum("cost"))["total"]
        return f"${total or 0:.4f}"

    @admin.action(description=_("Summarise selected conversations"))
    def summarise_conversations(self, request: HttpRequest, queryset: QuerySet[Conversation]) -> None:
        """Summarises those with no summary, or one written before their latest messages, up to SUMMARISE_PER_RUN."""
        selected = Conversation.objects.filter(pk__in=queryset.values("pk"))
        pending = list(needing_summary(selected))
        done = failed = 0
        for conversation in pending[: self.SUMMARISE_PER_RUN]:
            try:
                summarise(conversation)
                done += 1
            except spend.Resting:
                self.message_user(
                    request, _("Today's budget is spent: nothing more is summarised today."), messages.ERROR
                )
                break
            except Unsummarised as error:
                logger.warning("Vex could not summarise conversation %d: %s", conversation.pk, error)
                failed += 1
            except Exception:  # pylint: disable=broad-exception-caught
                # One conversation's surprise is no reason to lose the rest of the run; it is recorded and marked.
                logger.exception("Vex failed unexpectedly summarising conversation %d", conversation.pk)
                failed += 1
        left = len(pending) - done - failed
        self.message_user(
            request,
            _("Summarised %(done)d, %(failed)d failed, %(left)d left to summarise.")
            % {"done": done, "failed": failed, "left": left},
            messages.WARNING if failed or left else messages.SUCCESS,
        )

    def changelist_view(self, request: HttpRequest, extra_context: dict[str, Any] | None = None) -> HttpResponse:
        """Heads the list with today's spend against the budget, added up from every call, including those of
        conversations since deleted."""
        today = spend.day_spend(spend.today())
        subtitle = _("Today (UTC): $%(spent).4f of $%(budget)s, %(calls)d calls, %(cached).0f%% of input cached") % {
            "spent": today.dollars,
            "budget": settings.VEX_DAILY_BUDGET_USD,
            "calls": today.calls,
            "cached": today.cached_share * 100,
        }
        return super().changelist_view(request, {**(extra_context or {}), "subtitle": subtitle})


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
