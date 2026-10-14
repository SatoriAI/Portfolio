import logging
import time
from collections.abc import Generator, Sequence
from contextlib import closing
from datetime import UTC

from django.conf import settings
from django.db import transaction

from vex.ai import provider, spend
from vex.ai.history import MessageHistory, Turn
from vex.ai.knowledge import estimate_tokens
from vex.ai.prompt import PROMPT_VERSION, build_messages
from vex.choices import Outcomes
from vex.models import Conversation
from vex.models import Usage as UsageRecord

logger = logging.getLogger(__name__)


class EmptyAnswer(Exception):
    """The model finished without a word of text, as when its reasoning spends the whole output budget."""


def stream_answer(question: str, locale: str, session_key: str, asked_from: str = "") -> Generator[str, None, int]:
    """The answer to one question in a conversation, as text chunks, and the only way the API reaches the model.

    The exchange is saved once the answer is complete, and only then. An answer cut short (the visitor left, the
    provider failed, the stream ran out of time) saves nothing, so the history the model reads back never holds half
    a turn, and the question and its answer are saved together or not at all. Closing this generator closes the
    model's stream with it (see provider.stream_completion), which closes the provider's response: a visitor who
    leaves stops the generation, not only the reading of it.

    Every call is recorded in Usage however it ends, since every one of them is billed. Once today's calls have
    cost VEX_DAILY_BUDGET_USD, this raises spend.Resting before anything is read or written, and calls nothing.

    Once the answer is saved, the generator returns the saved answer's id (as StopIteration.value), so the visitor
    can rate it.

    `asked_from` says where on the site the question was asked (see vex.ai.context), or is empty. The model reads it
    beside the question, and it is saved with the question, so later turns read it back."""
    spend.check_budget()
    history = MessageHistory(session_key)
    messages = build_messages(question=question, locale=locale, history=history.recent(), asked_from=asked_from)
    usage = provider.Usage()
    answer: list[str] = []
    started = time.monotonic()
    first: float | None = None
    outcome = Outcomes.FAILED
    try:
        with closing(provider.stream_completion(messages, cache_key=f"vex-{locale}", usage=usage)) as chunks:
            for chunk in chunks:
                if chunk:
                    first = first or time.monotonic()
                    answer.append(chunk)
                    yield chunk
        outcome = Outcomes.ANSWERED if answer else Outcomes.EMPTY
    except GeneratorExit:
        outcome = Outcomes.ABANDONED
        raise
    finally:
        record_usage(history.conversation, usage, outcome, messages, "".join(answer))
    if not answer:
        raise EmptyAnswer(f"{settings.VEX_MODEL} returned no text ({usage.output_tokens} output tokens)")
    # Counts and timings only: what the visitor asked and what Vex said stay in the database, out of the logs.
    logger.info(
        "Vex answered: model=%s prompt=%s locale=%s first_token=%.2fs total=%.2fs input=%d cached=%d output=%d "
        "reasoning=%d finish=%s",
        settings.VEX_MODEL,
        PROMPT_VERSION,
        locale,
        (first or started) - started,
        time.monotonic() - started,
        usage.input_tokens,
        usage.cached_tokens,
        usage.output_tokens,
        usage.reasoning_tokens,
        usage.finish_reason,
    )
    with transaction.atomic():
        saved = history.add_exchange(
            Turn("user", question, asked_from), "".join(answer), usage=usage, prompt_version=PROMPT_VERSION
        )
    return saved.pk


def record_usage(
    conversation: Conversation,
    usage: provider.Usage,
    outcome: str,
    messages: Sequence[provider.ChatMessage],
    answer: str,
) -> None:
    """Writes what one call cost. Counts the provider never reported are estimated from the text: the whole prompt
    as input, none of it cached, and the text received as output."""
    if not usage.reported:
        usage.input_tokens = sum(estimate_tokens(message["content"]) for message in messages)
        usage.output_tokens = estimate_tokens(answer)
    record = UsageRecord.objects.create(
        conversation=conversation,
        model=settings.VEX_MODEL,
        prompt_version=PROMPT_VERSION,
        outcome=outcome,
        finish_reason=usage.finish_reason,
        input_tokens=usage.input_tokens,
        cached_tokens=usage.cached_tokens,
        output_tokens=usage.output_tokens,
        reasoning_tokens=usage.reasoning_tokens,
        estimated=not usage.reported,
        cost=usage.cost(settings.VEX_MODEL),
    )
    spend.add(record.cost, record.created_at.astimezone(UTC).date())
