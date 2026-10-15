from unittest import skipIf

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

PASSWORD = "correct-horse-battery"  # nosec B105: a test user's password


@skipIf(settings.DEBUG, "production's transport settings apply only without DEBUG")
# The admin's CSS is otherwise looked up in collectstatic's manifest, which a test run has not built.
@override_settings(
    STORAGES={
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
)
class TransportSecurityTestCase(TestCase):
    def setUp(self) -> None:
        self.url = reverse("health_check:health_check_home")

    def test_a_request_the_edge_forwarded_over_https_gets_hsts(self) -> None:
        response = self.client.get(self.url, headers={"X-Forwarded-Proto": "https"})
        self.assertEqual(response.headers["Strict-Transport-Security"], "max-age=31536000; includeSubDomains")

    def test_the_healthcheck_over_plain_http_is_answered_not_redirected(self) -> None:
        # Railway's healthcheck comes over the private network without X-Forwarded-Proto.
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Strict-Transport-Security", response.headers)

    def test_the_admins_cookies_are_https_only(self) -> None:
        get_user_model().objects.create_superuser("admin", password=PASSWORD)
        self.client.get(reverse("admin:login"))  # sets the CSRF cookie
        response = self.client.post(reverse("admin:login"), {"username": "admin", "password": PASSWORD})
        self.assertEqual(response.status_code, 302)
        self.assertTrue(self.client.cookies["csrftoken"]["secure"])
        self.assertTrue(response.cookies["sessionid"]["secure"])
