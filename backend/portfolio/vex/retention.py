"""Conversations are kept for settings.VEX_CONVERSATION_RETENTION_DAYS after their last message, as the chat tells
visitors, and then deleted with their messages. Their Usage rows stay, unlinked (the FK is SET_NULL): they are what
the calls cost, and hold no words.

A conversation's last activity is its newest message, not its updated_at: messages are created beside the
conversation, never saved through it, so updated_at stays where get_or_create left it. A conversation with no
messages (every answer abandoned or failed) dates from its creation.

There is no scheduler in production, so the purge runs inside a request: the first answer saved each day runs it, after
the answer is saved. A key in the "vex" cache (Redis in production, shared by every worker) lets one request a day
through. While Redis is down nothing runs, rather than every request trying; a purge that fails is logged and the
answer stands."""

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
    """Deletes every conversation with no message since the cutoff, and their messages; returns how many."""
    cutoff = (now or timezone.now()) - timedelta(days=settings.VEX_CONVERSATION_RETENTION_DAYS)
    stale = Conversation.objects.filter(created_at__lt=cutoff).exclude(messages__created_at__gte=cutoff)
    _, deleted = stale.delete()
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
