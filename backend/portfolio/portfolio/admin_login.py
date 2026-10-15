"""The admin's sign-in, throttled. The admin is public and a password is all that guards it, so after FAILURE_LIMIT
failed attempts from one IP at one username, that pair is refused without its password being checked until
LOCKOUT_SECONDS have passed since the last failure.

The pair, not either half alone: counted per username, anyone could lock Dawid out by failing at his; counted per IP,
an office or a mobile network shares one count. The username is hashed into the key, so what someone typed into the
form is never stored.

The counts live in the vex cache, which is Redis in production (see settings.CACHES), so both workers and all their
threads share them and a deploy does not reset them. Like Vex's own limits it fails open: with Redis down the form
checks passwords unthrottled rather than refusing every sign-in."""

import hashlib
from typing import Any

from django.contrib.admin.forms import AdminAuthenticationForm
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from utils.functions import client_ip
from vex.utils.cache import CacheUnavailable
from vex.utils.cache import cache as vex_cache

FAILURE_LIMIT = 5
LOCKOUT_SECONDS = 15 * 60


def failure_key(request: HttpRequest | None, username: str) -> str:
    # Without the trusted header the request did not come through the edge. Such requests share one count rather than
    # going uncounted: unlike Vex, the admin loses nothing by failing closed.
    ip = (client_ip(request) if request is not None else None) or "unknown"
    return f"admin-login-failures:{ip}:{hashlib.sha256(username.casefold().encode()).hexdigest()}"


class ThrottledAdminAuthenticationForm(AdminAuthenticationForm):
    error_messages = {
        **AdminAuthenticationForm.error_messages,
        "locked": _("Too many failed sign-ins. Try again in %(minutes)s minutes."),
    }

    def clean(self) -> dict[str, Any]:
        username = self.cleaned_data.get("username")
        if not username or not self.cleaned_data.get("password"):
            return super().clean()  # a field is missing, so nothing is checked and nothing counts
        key = failure_key(self.request, username)
        try:
            locked = (vex_cache.get(key) or 0) >= FAILURE_LIMIT
        except CacheUnavailable:
            locked = False
        if locked:
            raise ValidationError(
                self.error_messages["locked"], code="locked", params={"minutes": LOCKOUT_SECONDS // 60}
            )
        try:
            cleaned_data = super().clean()
        except ValidationError:
            self._count_failure(key)
            raise
        try:
            vex_cache.delete(key)
        except CacheUnavailable:
            pass
        return cleaned_data

    @staticmethod
    def _count_failure(key: str) -> None:
        try:
            vex_cache.add(key, 0, LOCKOUT_SECONDS)
            vex_cache.incr(key)
            vex_cache.touch(key, LOCKOUT_SECONDS)  # the lockout runs from the latest failure, not the first
        except CacheUnavailable:
            pass
