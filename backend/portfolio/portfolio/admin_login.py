"""The admin's sign-in, throttled. The admin is public and a password is all that guards it, so two limits stand in
front of the password check:

- one IP at one username gets PAIR_LIMIT attempts, and is then refused until PAIR_WINDOW_SECONDS have passed since
  the last attempt that was checked. The pair, not either half alone: per IP, an office or a mobile network would share
  one count; per username alone, it would be the only limit, and anyone could lock Dawid out in a few tries.
- one username gets USERNAME_LIMIT attempts in USERNAME_WINDOW_SECONDS from all IPs together, and is then refused for
  the rest of that window. This is what stops a guesser spread over many IPs. Its price is that such a guesser can
  keep Dawid out for up to the window; that was accepted. Only attempts the pair limit lets through count here, so
  one IP adds at most PAIR_LIMIT per PAIR_WINDOW_SECONDS and cannot reach the ceiling alone.

Every attempt is counted before its password is checked; a success clears its pair's count. Checking first and
counting after would let any number of simultaneous attempts through the check, each seeing the count as it was
before any of them failed. Counted first, at most PAIR_LIMIT attempts for a pair are ever checked, however many
arrive at once.

The username is hashed into the keys, so what someone typed into the form is never stored. The counts live in the vex
cache, which is Redis in production (see settings.CACHES), so both workers and all their threads share them and a
deploy does not reset them. Like Vex's own limits it fails open: with Redis down the form checks passwords
unthrottled rather than refusing every sign-in."""

import hashlib
from typing import Any, NoReturn

from django.contrib.admin.forms import AdminAuthenticationForm
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from utils.functions import client_ip
from vex.utils.cache import CacheUnavailable
from vex.utils.cache import cache as vex_cache

PAIR_LIMIT = 5
PAIR_WINDOW_SECONDS = 15 * 60
USERNAME_LIMIT = 50
USERNAME_WINDOW_SECONDS = 60 * 60


def _hashed(username: str) -> str:
    return hashlib.sha256(username.casefold().encode()).hexdigest()


def pair_key(request: HttpRequest | None, username: str) -> str:
    # Without the trusted header the request did not come through the edge. Such requests share one count rather than
    # going uncounted: unlike Vex, the admin loses nothing by failing closed.
    ip = (client_ip(request) if request is not None else None) or "unknown"
    return f"admin-login-attempts:{ip}:{_hashed(username)}"


def username_key(username: str) -> str:
    return f"admin-login-attempts:{_hashed(username)}"


def _reserve(key: str, timeout: int) -> int:
    """Counts one attempt and returns the count, this one included, or 0 when it could not be counted.

    Django's incr checks that the key exists and then increments it, and the key can expire in between. Before the
    check, incr raises ValueError: that one attempt goes uncounted. After it, Redis creates the key afresh at 1 with no
    expiry at all, which would count for ever; so a count of 1, however it came about, gets the window's expiry."""
    vex_cache.add(key, 0, timeout)
    try:
        count = int(vex_cache.incr(key))
    except ValueError:
        return 0
    if count == 1:
        vex_cache.touch(key, timeout)
    return count


class ThrottledAdminAuthenticationForm(AdminAuthenticationForm):
    error_messages = {
        **AdminAuthenticationForm.error_messages,
        "locked": _("Too many failed sign-ins. Try again in %(minutes)s minutes."),
    }

    def clean(self) -> dict[str, Any]:
        username = self.cleaned_data.get("username")
        if not username or not self.cleaned_data.get("password"):
            return super().clean()  # a field is missing, so nothing is checked and nothing counts
        pair = pair_key(self.request, username)
        try:
            pair_count = _reserve(pair, PAIR_WINDOW_SECONDS)
            if pair_count > PAIR_LIMIT:
                # Refused before the username is counted, so one IP's flood cannot use up the username's ceiling.
                self._refuse(PAIR_WINDOW_SECONDS)
            # Sliding: the pair's lockout runs from its latest checked attempt. Refused ones do not extend it.
            vex_cache.touch(pair, PAIR_WINDOW_SECONDS)
            # A fixed window, never refreshed. Successes count too: fifty an hour is far beyond Dawid's own use.
            if _reserve(username_key(username), USERNAME_WINDOW_SECONDS) > USERNAME_LIMIT:
                self._refuse(USERNAME_WINDOW_SECONDS)
        except CacheUnavailable:
            pass
        cleaned_data = super().clean()  # a wrong password raises here, and its attempt stays counted
        try:
            vex_cache.delete(pair)
        except CacheUnavailable:
            pass
        return cleaned_data

    def _refuse(self, window_seconds: int) -> NoReturn:
        raise ValidationError(self.error_messages["locked"], code="locked", params={"minutes": window_seconds // 60})
