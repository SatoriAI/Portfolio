from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import NoReverseMatch, reverse

from vex.ai import spend
from vex.ai.summary import Unsummarised
from vex.choices import Outcomes, Purposes, Roles
from vex.models import Conversation, Message, Usage
from vex.tests.unit_tests.test_ai.test_summary import replying


# Without DEBUG the admin's CSS is looked up in collectstatic's manifest, which a test run has not built.
@override_settings(
    STORAGES={
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
)
class ConversationAdminTestCase(TestCase):
    def setUp(self) -> None:
        self.client.force_login(get_user_model().objects.create_superuser("admin", "admin@example.com", "pw"))
        self.conversation = Conversation.objects.create(session="s" * 32)
        self.message = Message.objects.create(conversation=self.conversation, role=Roles.ASSISTANT, content="Hi")
        Usage.objects.create(
            conversation=self.conversation,
            model="claude-opus-5-5",
            prompt_version="v1",
            outcome=Outcomes.ANSWERED,
            input_tokens=1000,
            cached_tokens=0,
            output_tokens=100,
            reasoning_tokens=0,
            estimated=False,
            cost="0.01250000",
        )

    def test_messages_and_usage_have_no_tab_of_their_own(self) -> None:
        for name in ("admin:vex_message_changelist", "admin:vex_usage_changelist"):
            with self.assertRaises(NoReverseMatch):
                reverse(name)

    def test_a_message_cannot_be_deleted_from_its_conversation(self) -> None:
        url = reverse("admin:vex_conversation_change", args=[self.conversation.pk])
        self.assertNotContains(self.client.get(url), "messages-0-DELETE")
        self.client.post(
            url,
            {
                "messages-TOTAL_FORMS": "1",
                "messages-INITIAL_FORMS": "1",
                "messages-0-id": str(self.message.pk),
                "messages-0-conversation": str(self.conversation.pk),
                "messages-0-DELETE": "on",
                "usage-TOTAL_FORMS": "1",
                "usage-INITIAL_FORMS": "1",
                "usage-0-id": str(Usage.objects.get().pk),
                "usage-0-conversation": str(self.conversation.pk),
            },
        )
        self.assertTrue(Message.objects.filter(pk=self.message.pk).exists())

    def test_a_conversation_is_deleted_with_its_messages(self) -> None:
        url = reverse("admin:vex_conversation_delete", args=[self.conversation.pk])
        self.assertNotContains(self.client.get(url), "permission to delete")
        resp = self.client.post(url, {"post": "yes"})
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(Conversation.objects.exists())
        self.assertFalse(Message.objects.exists())
        self.assertTrue(Usage.objects.filter(conversation=None).exists())  # the money was spent all the same

    def test_a_conversation_opens_with_its_messages(self) -> None:
        resp = self.client.get(reverse("admin:vex_conversation_change", args=[self.conversation.pk]))
        self.assertContains(resp, "Hi")
        self.assertContains(resp, "Summary failed")  # the only sign of a failed summary outside the logs
        self.assertNotContains(resp, 'name="summary_failed"')  # shown, not set by hand

    def test_a_conversation_shows_its_usage_and_what_it_cost(self) -> None:
        resp = self.client.get(reverse("admin:vex_conversation_change", args=[self.conversation.pk]))
        self.assertContains(resp, "claude-opus-5-5")
        self.assertContains(resp, "$0.0125")

    def test_a_summary_written_in_the_admin_is_not_the_visitors_cost(self) -> None:
        Usage.objects.create(
            conversation=self.conversation,
            model="claude-opus-5-5",
            prompt_version="summary",
            purpose=Purposes.SUMMARY,
            outcome=Outcomes.ANSWERED,
            input_tokens=1000,
            cached_tokens=0,
            output_tokens=100,
            reasoning_tokens=0,
            estimated=False,
            cost="0.00600000",
        )
        resp = self.client.get(reverse("admin:vex_conversation_change", args=[self.conversation.pk]))
        self.assertContains(resp, "$0.0125")


@override_settings(
    STORAGES={
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
)
class ConversationSummaryAdminTestCase(TestCase):
    def setUp(self) -> None:
        self.client.force_login(get_user_model().objects.create_superuser("admin", "admin@example.com", "pw"))
        self.url = reverse("admin:vex_conversation_changelist")

    def conversation(self, question: str, **fields: object) -> Conversation:
        conversation = Conversation.objects.create(session="s" * 32)
        Message.objects.create(conversation=conversation, role=Roles.USER, content=question)
        Message.objects.create(conversation=conversation, role=Roles.ASSISTANT, content="An answer")
        Conversation.objects.filter(pk=conversation.pk).update(**fields)
        return conversation

    def test_the_list_reads_the_summary_or_the_first_question(self) -> None:
        self.conversation("Who is   Dawid?")
        self.conversation("Hi", summary="Recruiter asking about Django roles", summarised_messages=2)
        self.conversation("Hi", summary="Student asking about teaching", summarised_messages=1)
        resp = self.client.get(self.url)
        self.assertContains(resp, ">Who is Dawid?</span><")
        self.assertContains(resp, ">Recruiter asking about Django roles</span><")
        self.assertContains(resp, ">Student asking about teaching</span> (+)</span>")  # messages came after it

    def test_a_long_line_is_whole_on_hover_and_escaped(self) -> None:
        question = 'Can you <b>tell</b> me" onmouseover="alert(1) ' + "about Dawid's research " * 40
        self.conversation(question)
        resp = self.client.get(self.url)
        escaped = (
            question.strip().replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#x27;")
        )
        self.assertContains(resp, f'title="{escaped}"')
        self.assertContains(resp, "text-overflow: ellipsis")
        self.assertNotContains(resp, "<b>tell</b>")
        self.assertNotContains(resp, '" onmouseover="')

    def test_the_action_and_its_report_speak_polish(self) -> None:
        pending = self.conversation("Kim jest Dawid?")  # an empty list shows neither the actions nor the columns
        resp = self.client.get(self.url, headers={"accept-language": "pl"})
        self.assertContains(resp, "Podsumuj wybrane rozmowy")
        self.assertContains(resp, "O czym")
        with (
            patch("vex.ai.summary.spend.check_budget"),
            patch("vex.ai.summary.provider.complete", side_effect=replying("Pytanie o Dawida")),
        ):
            resp = self.client.post(
                self.url,
                {"action": "summarise_conversations", "_selected_action": [pending.pk]},
                headers={"accept-language": "pl"},
                follow=True,
            )
        self.assertContains(resp, "Podsumowano: 1, nieudane: 0, do podsumowania zostało: 0.")

    def test_the_list_is_searched_by_what_was_said(self) -> None:
        self.conversation("Tell me about heat kernels")
        self.conversation("Who is Dawid?")
        resp = self.client.get(self.url, {"q": "kernels"})
        self.assertContains(resp, "heat kernels")
        self.assertNotContains(resp, "Who is Dawid?")

    def summarise(self, *conversations: Conversation) -> object:
        return self.client.post(
            self.url,
            {"action": "summarise_conversations", "_selected_action": [c.pk for c in conversations]},
            follow=True,
        )

    def test_runs_catch_up_first_then_go_round_every_selected_conversation(self) -> None:
        # The real summariser behind a fake Claude, so each attempt's time and each summary are written.
        conversations = [self.conversation(f"Question {i}") for i in range(7)]
        with (
            patch("vex.admin.ConversationAdmin.SUMMARISE_PER_RUN", 3),
            patch("vex.ai.summary.spend.check_budget"),
            patch("vex.ai.summary.provider.complete", side_effect=replying("Visitor asking a question")),
        ):
            reports = [self.summarise(*conversations) for _ in range(4)]
        for report, expected in zip(reports, ("3, 0 failed, 4 left", "3, 0 failed, 1 left", "3, 0 failed, 0 left")):
            self.assertContains(report, f"Summarised {expected} to summarise.")
        self.assertFalse(Conversation.objects.filter(summary="").exists())
        runs = list(Usage.objects.order_by("pk").values_list("conversation", flat=True))
        self.assertCountEqual(runs[:7], [c.pk for c in conversations])  # each once before any is redone
        self.assertEqual(runs[7:], runs[:5])  # then round again, those summarised longest ago first

    def test_a_conversation_behind_its_summary_goes_before_current_ones(self) -> None:
        current = self.conversation("Hi", summary="Current", summarised_messages=2)
        behind = self.conversation("Who is Dawid?", summary="Old", summarised_messages=1)
        with patch("vex.admin.ConversationAdmin.SUMMARISE_PER_RUN", 1), patch("vex.admin.summarise") as summarise:
            self.summarise(current, behind)
        summarise.assert_called_once_with(behind)

    def test_the_action_reports_failures_apart_and_stops_on_a_spent_budget(self) -> None:
        conversations = [self.conversation(f"Question {i}") for i in range(3)]
        with patch("vex.admin.summarise", side_effect=[Unsummarised("declined"), RuntimeError("surprise"), None]):
            resp = self.summarise(*conversations)
        # The mock writes nothing, so the third is still behind; the two that failed are counted as failed only.
        self.assertContains(resp, "Summarised 1, 2 failed, 1 left to summarise.")  # the run went on past a surprise
        with patch("vex.admin.summarise", side_effect=spend.Resting("spent")):
            resp = self.summarise(*conversations)
        self.assertContains(resp, "budget is spent")
        self.assertContains(resp, "Summarised 0, 0 failed, 3 left to summarise.")
