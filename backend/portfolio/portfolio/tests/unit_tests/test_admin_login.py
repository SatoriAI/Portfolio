import time
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.test import TestCase, override_settings
from django.urls import reverse

from portfolio.admin_login import FAILURE_LIMIT, LOCKOUT_SECONDS, vex_cache

PASSWORD = "correct-horse-battery"  # nosec B105: a test user's password
WRONG = "not-the-password"
LOCKED = "Too many failed sign-ins"
REDIS_DOWN = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "vex": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:1/0",
        "OPTIONS": {"socket_connect_timeout": 0.5},
    },
}


# Without DEBUG the admin's CSS is looked up in collectstatic's manifest, which a test run has not built.
@override_settings(
    TRUSTED_CLIENT_IP_HEADER="X-Real-IP",
    STORAGES={
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
)
class AdminLoginThrottleTestCase(TestCase):
    def setUp(self) -> None:
        vex_cache.clear()
        get_user_model().objects.create_superuser("admin", password=PASSWORD)
        self.url = reverse("admin:login")

    def sign_in(self, password: str, username: str = "admin", ip: str | None = "1.1.1.1") -> HttpResponse:
        self.client.logout()
        headers = {"X-Real-IP": ip} if ip else {}
        return self.client.post(self.url, {"username": username, "password": password}, headers=headers)

    def fail_sign_ins(self, times: int = FAILURE_LIMIT, **kwargs: str | None) -> None:
        for _ in range(times):
            response = self.sign_in(WRONG, **kwargs)
            self.assertEqual(response.status_code, 200)
            self.assertNotContains(response, LOCKED)

    def assert_signed_in(self, response: HttpResponse) -> None:
        self.assertEqual(response.status_code, 302)

    def assert_locked(self, response: HttpResponse) -> None:
        self.assertContains(response, LOCKED)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_the_right_password_is_refused_once_the_pair_has_failed_too_often(self) -> None:
        self.fail_sign_ins()
        self.assert_locked(self.sign_in(PASSWORD))

    def test_one_fewer_failure_does_not_lock(self) -> None:
        self.fail_sign_ins(FAILURE_LIMIT - 1)
        self.assert_signed_in(self.sign_in(PASSWORD))

    def test_the_lock_holds_one_ip_at_one_username(self) -> None:
        self.fail_sign_ins()
        self.assert_signed_in(self.sign_in(PASSWORD, ip="2.2.2.2"))
        self.assertNotContains(self.sign_in(WRONG, username="someone-else"), LOCKED)

    def test_the_ip_comes_from_the_trusted_header_not_x_forwarded_for(self) -> None:
        for n in range(FAILURE_LIMIT):
            self.client.post(
                self.url,
                {"username": "admin", "password": WRONG},
                headers={"X-Real-IP": "1.1.1.1", "X-Forwarded-For": f"10.0.0.{n}"},
            )
        self.assert_locked(self.sign_in(PASSWORD))

    def test_requests_without_the_header_share_one_count(self) -> None:
        self.fail_sign_ins(ip=None)
        self.assert_locked(self.sign_in(PASSWORD, ip=None))
        self.assert_signed_in(self.sign_in(PASSWORD))

    def test_a_successful_sign_in_clears_the_count(self) -> None:
        self.fail_sign_ins(FAILURE_LIMIT - 1)
        self.assert_signed_in(self.sign_in(PASSWORD))
        self.fail_sign_ins(FAILURE_LIMIT - 1)
        self.assert_signed_in(self.sign_in(PASSWORD))

    def test_the_lock_lifts_once_the_window_since_the_last_failure_has_passed(self) -> None:
        now, last = time.time(), time.time() + 600
        with patch("time.time", return_value=now):
            self.fail_sign_ins(FAILURE_LIMIT - 1)
        with patch("time.time", return_value=last):
            self.fail_sign_ins(1)
        with patch("time.time", return_value=now + LOCKOUT_SECONDS + 1):
            self.assert_locked(self.sign_in(PASSWORD))
        with patch("time.time", return_value=last + LOCKOUT_SECONDS + 1):
            self.assert_signed_in(self.sign_in(PASSWORD))

    @override_settings(CACHES=REDIS_DOWN)
    def test_with_redis_down_passwords_are_checked_unthrottled(self) -> None:
        with self.assertLogs("vex.utils.cache", level="ERROR"):
            self.fail_sign_ins()
            self.assert_signed_in(self.sign_in(PASSWORD))
