import time
from typing import Any
from unittest.mock import patch

import fakeredis
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import caches
from django.http import HttpResponse
from django.test import RequestFactory, TestCase, override_settings
from django.urls import reverse

from portfolio.admin_login import (
    PAIR_LIMIT,
    PAIR_WINDOW_SECONDS,
    USERNAME_LIMIT,
    USERNAME_WINDOW_SECONDS,
    _reserve,
    pair_key,
    username_key,
    vex_cache,
)

PASSWORD = "correct-horse-battery"  # nosec B105: a test user's password
WRONG = "not-the-password"
LOCKED = "Too many failed sign-ins"
# Django's own Redis cache, talking to an in-process fake rather than a server.
FAKE_REDIS = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "vex": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://fake:6379/0",
        "OPTIONS": {"connection_class": fakeredis.FakeConnection},
    },
}
REDIS_DOWN = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "vex": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:1/0",
        "OPTIONS": {"socket_connect_timeout": 0.5},
    },
}


# Without DEBUG the admin's CSS is looked up in collectstatic's manifest, which a test run has not built. The fast
# hasher keeps the username ceiling's fifty sign-ins quick.
@override_settings(
    TRUSTED_CLIENT_IP_HEADER="X-Real-IP",
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
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

    def fail_sign_ins(self, times: int = PAIR_LIMIT, **kwargs: str | None) -> None:
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
        self.fail_sign_ins(PAIR_LIMIT - 1)
        self.assert_signed_in(self.sign_in(PASSWORD))

    def test_the_lock_holds_one_ip_at_one_username(self) -> None:
        self.fail_sign_ins()
        self.assert_signed_in(self.sign_in(PASSWORD, ip="2.2.2.2"))
        self.assertNotContains(self.sign_in(WRONG, username="someone-else"), LOCKED)

    def test_the_ip_comes_from_the_trusted_header_not_x_forwarded_for(self) -> None:
        for n in range(PAIR_LIMIT):
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
        self.fail_sign_ins(PAIR_LIMIT - 1)
        self.assert_signed_in(self.sign_in(PASSWORD))
        self.fail_sign_ins(PAIR_LIMIT - 1)
        self.assert_signed_in(self.sign_in(PASSWORD))

    def test_the_lock_lifts_once_the_window_since_the_last_failure_has_passed(self) -> None:
        now, last = time.time(), time.time() + 600
        with patch("time.time", return_value=now):
            self.fail_sign_ins(PAIR_LIMIT - 1)
        with patch("time.time", return_value=last):
            self.fail_sign_ins(1)
        with patch("time.time", return_value=now + PAIR_WINDOW_SECONDS + 1):
            self.assert_locked(self.sign_in(PASSWORD))
        with patch("time.time", return_value=last + PAIR_WINDOW_SECONDS + 1):
            self.assert_signed_in(self.sign_in(PASSWORD))

    def test_the_username_is_refused_from_every_ip_once_all_of_them_together_have_failed_too_often(self) -> None:
        now = time.time()
        with patch("time.time", return_value=now):
            for n in range(USERNAME_LIMIT):
                self.fail_sign_ins(1, ip=f"10.0.{n // 250}.{n % 250}")
            self.assert_locked(self.sign_in(PASSWORD, ip="2.2.2.2"))
            self.assertNotContains(self.sign_in(WRONG, username="someone-else", ip="2.2.2.2"), LOCKED)
        with patch("time.time", return_value=now + USERNAME_WINDOW_SECONDS + 1):
            self.assert_signed_in(self.sign_in(PASSWORD, ip="2.2.2.2"))

    def test_one_fewer_failure_across_ips_does_not_lock_the_username(self) -> None:
        for n in range(USERNAME_LIMIT - 1):
            self.fail_sign_ins(1, ip=f"10.0.{n // 250}.{n % 250}")
        self.assert_signed_in(self.sign_in(PASSWORD, ip="2.2.2.2"))

    def test_an_attempt_is_counted_before_its_password_is_checked(self) -> None:
        key = pair_key(RequestFactory().get("/", headers={"X-Real-IP": "1.1.1.1"}), "admin")
        counts_at_check = []

        def checking(*args: Any, **kwargs: Any) -> Any:
            counts_at_check.append(vex_cache.get(key))
            return authenticate(*args, **kwargs)

        with patch("django.contrib.auth.forms.authenticate", side_effect=checking):
            self.fail_sign_ins(1)
        self.assertEqual(counts_at_check, [1])

    def test_attempts_in_flight_hold_the_limit_so_no_more_are_checked(self) -> None:
        # PAIR_LIMIT attempts arriving at once have each reserved their place and are still being checked.
        vex_cache.set(pair_key(RequestFactory().get("/", headers={"X-Real-IP": "1.1.1.1"}), "admin"), PAIR_LIMIT)
        with patch("django.contrib.auth.forms.authenticate") as checked:
            self.assert_locked(self.sign_in(PASSWORD))
        checked.assert_not_called()

    def test_a_username_count_stranded_without_expiry_does_not_lock_the_next_hour(self) -> None:
        now = time.time()
        with patch("time.time", return_value=now - USERNAME_WINDOW_SECONDS):
            vex_cache.set(username_key("admin"), USERNAME_LIMIT * 10, None)  # no expiry at all
            self.assert_locked(self.sign_in(PASSWORD, ip="2.2.2.2"))
        with patch("time.time", return_value=now):
            self.assert_signed_in(self.sign_in(PASSWORD, ip="3.3.3.3"))

    def test_one_ips_flood_does_not_use_up_the_usernames_ceiling(self) -> None:
        for _ in range(USERNAME_LIMIT + 10):
            self.sign_in(WRONG)
        self.assert_signed_in(self.sign_in(PASSWORD, ip="2.2.2.2"))

    @override_settings(CACHES=REDIS_DOWN)
    def test_with_redis_down_passwords_are_checked_unthrottled(self) -> None:
        with self.assertLogs("vex.utils.cache", level="ERROR"):
            self.fail_sign_ins()
            self.assert_signed_in(self.sign_in(PASSWORD))


class ReserveTestCase(TestCase):
    """Counting one attempt when the key expires in the middle of Django's incr."""

    def setUp(self) -> None:
        vex_cache.clear()

    def test_a_key_that_expires_before_incr_checks_it_leaves_the_attempt_uncounted(self) -> None:
        with patch.object(vex_cache, "add"):  # as if the key expired right after add
            self.assertEqual(_reserve("admin-login-attempts:test", 60), 0)
        self.assertIsNone(vex_cache.get("admin-login-attempts:test"))

    @override_settings(CACHES=FAKE_REDIS)
    def test_a_key_redis_recreates_without_expiry_gets_the_windows(self) -> None:
        # Django's incr checks the key exists, then INCRBY; expiring in between, Redis recreates it at 1 with no TTL.
        backend = caches["vex"]
        key = backend.make_and_validate_key("admin-login-attempts:test")
        client = backend._cache.get_client(key, write=True)  # pylint: disable=protected-access

        def expiring_incr(*_args: Any, **_kwargs: Any) -> int:
            client.delete(key)
            return int(client.incr(key))

        with patch.object(vex_cache, "incr", side_effect=expiring_incr):
            self.assertEqual(_reserve("admin-login-attempts:test", 60), 1)
        self.assertTrue(0 < client.ttl(key) <= 60)
