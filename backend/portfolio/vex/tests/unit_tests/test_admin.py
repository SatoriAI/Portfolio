from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import NoReverseMatch, reverse

from vex.ai import spend
from vex.ai.summary import Unsummarised
from vex.choices import Outcomes, Purposes, Roles
from vex.models import Conversation, Message, Usage


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
        self.conversation("Who is Dawid?")
        self.conversation("Hi", summary="Recruiter asking about Django roles", summarised_messages=2)
        self.conversation("Hi", summary="Student asking about teaching", summarised_messages=1)
        resp = self.client.get(self.url)
        self.assertContains(resp, "Who is Dawid?")
        self.assertContains(resp, "Recruiter asking about Django roles<")
        self.assertContains(resp, "Student asking about teaching (+)")  # messages came after it

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

    def test_the_action_summarises_those_that_need_it(self) -> None:
        current = self.conversation("Hi", summary="Current", summarised_messages=2)
        pending = self.conversation("Who is Dawid?")
        with patch("vex.admin.summarise") as summarise:
            resp = self.summarise(current, pending)
        summarise.assert_called_once_with(pending)
        self.assertContains(resp, "Summarised 1, 0 failed, 0 left to summarise.")

    def test_the_action_stops_at_its_limit_and_on_a_spent_budget(self) -> None:
        conversations = [self.conversation(f"Question {i}") for i in range(3)]
        with patch("vex.admin.ConversationAdmin.SUMMARISE_PER_RUN", 2), patch("vex.admin.summarise") as summarise:
            summarise.side_effect = [None, Unsummarised("declined")]
            resp = self.summarise(*conversations)
        self.assertContains(resp, "Summarised 1, 1 failed, 1 left to summarise.")
        with patch("vex.admin.summarise", side_effect=spend.Resting("spent")):
            resp = self.summarise(*conversations)
        self.assertContains(resp, "budget is spent")
        self.assertContains(resp, "Summarised 0, 0 failed, 3 left to summarise.")
