import logging
import time
from collections.abc import Generator
from contextlib import closing

from django.conf import settings
from django.db import transaction

from vex.ai import provider
from vex.ai.history import MessageHistory
from vex.ai.prompt import PROMPT_VERSION, build_messages

logger = logging.getLogger(__name__)


class EmptyAnswer(Exception):
    """The model finished without a word of text, as when its reasoning spends the whole output budget."""


def stream_answer(question: str, locale: str, session_key: str) -> Generator[str]:
    """The answer to one question in a conversation, as text chunks, and the only way the API reaches the model.

    The exchange is saved once the answer is complete, and only then. An answer cut short (the visitor left, the
    provider failed, the stream ran out of time) saves nothing, so the history the model reads back never holds half
    a turn, and the question and its answer are saved together or not at all. Closing this generator closes the
    model's stream with it (see provider.stream_completion), which closes the provider's response: a visitor who
    leaves stops the generation, not only the reading of it."""
    history = MessageHistory(session_key)
    messages = build_messages(question=question, locale=locale, history=history.recent())
    usage = provider.Usage()
    answer: list[str] = []
    started = time.monotonic()
    first: float | None = None
    with closing(provider.stream_completion(messages, cache_key=f"vex-{locale}", usage=usage)) as chunks:
        for chunk in chunks:
            if chunk:
                first = first or time.monotonic()
                answer.append(chunk)
                yield chunk
    if not answer:
        raise EmptyAnswer(f"{settings.VEX_MODEL} returned no text ({usage.output_tokens} output tokens)")
    # Counts and timings only: what the visitor asked and what Vex said stay in the database, out of the logs.
    logger.info(
        "Vex answered: model=%s prompt=%s locale=%s first_token=%.2fs total=%.2fs input=%d cached=%d output=%d "
        "reasoning=%d",
        settings.VEX_MODEL,
        PROMPT_VERSION,
        locale,
        (first or started) - started,
        time.monotonic() - started,
        usage.input_tokens,
        usage.cached_tokens,
        usage.output_tokens,
        usage.reasoning_tokens,
    )
    with transaction.atomic():
        history.add_exchange(question, "".join(answer), usage=usage, prompt_version=PROMPT_VERSION)
