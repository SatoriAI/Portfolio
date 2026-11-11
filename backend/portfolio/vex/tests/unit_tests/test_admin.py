from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import NoReverseMatch, reverse

from vex.choices import Outcomes, Roles
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
