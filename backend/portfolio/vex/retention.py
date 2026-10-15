"""Conversations are kept for settings.VEX_CONVERSATION_RETENTION_DAYS after their last activity, as the chat tells
visitors, and then deleted with their messages. Their Usage rows stay, unlinked (the FK is SET_NULL): they are what
the calls cost, and hold no words.

A conversation's last activity is its updated_at, which every question touches as it arrives (vex.ai.history), before
the model is called; so a purge running meanwhile cannot take a conversation that is being written to.

There is no scheduler in production, so the purge runs inside a request: the first answer of each day runs it, after
the visitor has been sent its done event (vex.api.sse). A key in the "vex" cache (Redis in production, shared by every
worker) lets one request a day through. While Redis is down nothing runs, rather than every request trying; a purge
that fails is logged and never reaches the visitor."""

import logging
from datetime import datetime, timedelta

from django.conf import settings
from django.utils import timezone

from vex.models import Conversation
from vex.utils.cache import CacheUnavailable, cache

logger = logging.getLogger(__name__)

PURGE_KEY = "vex:retention:purged"
PURGE_EVERY_SECONDS = 24 * 60 * 60


def purge_stale_conversations(now: datetime | None = None) -> int:
    """Deletes every conversation with no activity since the cutoff, and their messages; returns how many."""
    cutoff = (now or timezone.now()) - timedelta(days=settings.VEX_CONVERSATION_RETENTION_DAYS)
    _, deleted = Conversation.objects.filter(updated_at__lt=cutoff).delete()
    return deleted.get(Conversation._meta.label, 0)


def purge_daily() -> None:
    """Runs the purge if no process has in the last day. Never raises: a purge must not cost a visitor an answer."""
    try:
        if not cache.add(PURGE_KEY, timezone.now().isoformat(), PURGE_EVERY_SECONDS):
            return
        if count := purge_stale_conversations():
            logger.info("Vex deleted %d conversations older than its retention period", count)
    except CacheUnavailable:
        pass  # the breaker has logged it; the first answer once Redis is back runs the purge
    except Exception:  # pylint: disable=broad-exception-caught
        logger.exception("Vex's conversation purge failed; it runs again tomorrow")
