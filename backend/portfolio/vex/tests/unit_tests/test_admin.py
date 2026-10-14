from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from vex.choices import Roles
from vex.models import Conversation, Message


# Without DEBUG the admin's CSS is looked up in collectstatic's manifest, which a test run has not built.
@override_settings(
    STORAGES={
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
)
class MessageAdminTestCase(TestCase):
    def setUp(self) -> None:
        self.client.force_login(get_user_model().objects.create_superuser("admin", "admin@example.com", "pw"))
        self.conversation = Conversation.objects.create(session="s" * 32)
        self.message = Message.objects.create(conversation=self.conversation, role=Roles.ASSISTANT, content="Hi")

    def test_a_message_cannot_be_deleted_on_its_own(self) -> None:
        resp = self.client.post(reverse("admin:vex_message_delete", args=[self.message.pk]), {"post": "yes"})
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(Message.objects.filter(pk=self.message.pk).exists())

    def test_a_conversation_is_deleted_with_its_messages(self) -> None:
        url = reverse("admin:vex_conversation_delete", args=[self.conversation.pk])
        self.assertNotContains(self.client.get(url), "permission to delete")
        resp = self.client.post(url, {"post": "yes"})
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(Conversation.objects.exists())
        self.assertFalse(Message.objects.exists())
