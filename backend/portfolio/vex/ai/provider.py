"""The one place Vex reaches Claude. The SDK's types stop here: callers pass plain role/content messages and read
plain text back, with the call's token counts in a Usage of their own."""

import logging
from collections.abc import Generator, Sequence
from dataclasses import dataclass
from decimal import Decimal
from functools import lru_cache
from typing import Literal, TypedDict, cast

from anthropic import Anthropic, Timeout
from anthropic.types.beta import BetaMessage, BetaMessageParam
from django.conf import settings

logger = logging.getLogger(__name__)

# How long a call to Claude may take. Without these the client waits ten minutes on a provider that stops sending,
# and retries twice more on top. The read timeout bounds each wait for the next event, so a stalled answer fails
# within half a minute instead of holding a server thread.
TIMEOUT = Timeout(30, connect=5)
MAX_RETRIES = 1

# On a policy decline (Claude's safety classifiers), the API answers with the model Anthropic recommends for that
# kind of decline instead of returning the refusal, in the same stream. Both attempts are billed, each at its model.
FALLBACK_BETA = "server-side-fallback-2026-07-01"


class ChatMessage(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str


class Refused(Exception):
    """Claude, and the model it fell back on, declined to answer. Whatever text came before the decline is not an
    answer, so nothing is saved."""


@dataclass(frozen=True)
class Attempt:
    """One model's part in a call that fell back: the model that declined, or the one that answered after it."""

    model: str
    input_tokens: int
    cached_tokens: int
    cache_write_tokens: int
    output_tokens: int


@dataclass
class Usage:  # pylint: disable=too-many-instance-attributes
    """What one call cost, in tokens, and why its answer ended. The provider reports the prompt's counts as the
    stream opens and the answer's with its final message: an answer cut short has the first and not the second, and
    `reported` stays False (see vex.ai.engine.record_usage).

    `input_tokens` is the whole prompt: read from the prompt cache (`cached_tokens`), written to it
    (`cache_write_tokens`) and neither. Reasoning is part of `output_tokens`."""

    input_tokens: int = 0
    cached_tokens: int = 0
    cache_write_tokens: int = 0
    output_tokens: int = 0
    reasoning_tokens: int = 0
    # "end_turn" for a finished answer, "max_tokens" for one cut at VEX_MAX_OUTPUT_TOKENS, "refusal" for a decline;
    # empty when the stream never said.
    finish_reason: str = ""
    # The model that answered: VEX_MODEL, or the one the API fell back on. Empty until the stream opens.
    model: str = ""
    # Each model's share, only on a call that fell back; otherwise every token was VEX_MODEL's.
    attempts: tuple[Attempt, ...] = ()
    reported: bool = False

    def read_prompt(self, message: BetaMessage) -> None:
        """The prompt's counts, from the message as the stream opens, before a word of the answer."""
        self.model = message.model
        self.cached_tokens = message.usage.cache_read_input_tokens or 0
        self.cache_write_tokens = message.usage.cache_creation_input_tokens or 0
        self.input_tokens = message.usage.input_tokens + self.cached_tokens + self.cache_write_tokens

    def read(self, message: BetaMessage, requested: str) -> None:
        """Everything, from the final message. `requested` is the model asked for, which an attempt that declined
        may not name."""
        usage = message.usage
        self.model = message.model
        self.finish_reason = message.stop_reason or ""
        if usage.output_tokens_details:
            self.reasoning_tokens = usage.output_tokens_details.thinking_tokens
        # The top-level counts cover only the attempt that answered; every attempt is in `iterations`.
        if usage.iterations and any(step.type == "fallback_message" for step in usage.iterations):
            self.attempts = tuple(
                Attempt(
                    model=getattr(step, "model", None) or requested,
                    input_tokens=step.input_tokens + step.cache_read_input_tokens + step.cache_creation_input_tokens,
                    cached_tokens=step.cache_read_input_tokens,
                    cache_write_tokens=step.cache_creation_input_tokens,
                    output_tokens=step.output_tokens,
                )
                for step in usage.iterations
                if step.type in ("message", "fallback_message")
            )
            self.input_tokens = sum(attempt.input_tokens for attempt in self.attempts)
            self.cached_tokens = sum(attempt.cached_tokens for attempt in self.attempts)
            self.cache_write_tokens = sum(attempt.cache_write_tokens for attempt in self.attempts)
            self.output_tokens = sum(attempt.output_tokens for attempt in self.attempts)
        else:
            self.cached_tokens = usage.cache_read_input_tokens or 0
            self.cache_write_tokens = usage.cache_creation_input_tokens or 0
            self.input_tokens = usage.input_tokens + self.cached_tokens + self.cache_write_tokens
            self.output_tokens = usage.output_tokens
        self.reported = True

    def cost(self) -> Decimal:
        """The call's price in dollars at settings.VEX_PRICES: each attempt at its own model's prices on a call that
        fell back, otherwise every token at the answering model's (VEX_MODEL's, when the stream never opened)."""
        if self.attempts:
            return sum((price(attempt.model, attempt) for attempt in self.attempts), Decimal(0))
        return price(self.model or settings.VEX_MODEL, self)


def price(model: str, tokens: Usage | Attempt) -> Decimal:
    """`tokens`' price in dollars at `model`'s prices. Settings refuse to start with a VEX_MODEL that has no price, so
    a model missing here is a mistake (or a fallback model not yet listed): it is counted at the highest price known
    for each kind of token rather than not at all, which could switch the budget off."""
    prices = settings.VEX_PRICES.get(model)
    if prices is None:
        logger.error("Vex has no price for %s in VEX_PRICES: its call is counted at the highest prices", model)
        prices = tuple(max(column) for column in zip(*settings.VEX_PRICES.values(), strict=True))
    fresh, cached, written, output = (Decimal(str(value)) for value in prices)
    dollars = (
        (tokens.input_tokens - tokens.cached_tokens - tokens.cache_write_tokens) * fresh
        + tokens.cached_tokens * cached
        + tokens.cache_write_tokens * written
        + tokens.output_tokens * output
    )
    return dollars / 1_000_000


@lru_cache(maxsize=1)
def client() -> Anthropic:
    """One client per process, so its connections are reused. An empty key falls back to ANTHROPIC_API_KEY in the
    environment, as the SDK does by default (and as the tests' fake provider relies on)."""
    return Anthropic(api_key=settings.ANTHROPIC_API_KEY or None, timeout=TIMEOUT, max_retries=MAX_RETRIES)


def stream_completion(messages: Sequence[ChatMessage], *, usage: Usage) -> Generator[str]:
    """The model's reply to `messages`, as text chunks, with its token counts and finish reason written to `usage`.

    The system message goes ahead of the conversation, marked for the prompt cache: it is the same for every
    question in a language (see vex.ai.prompt), so within five minutes of the last question it is read from the cache
    at a twentieth of the price. The conversation after it changes with every question and is not cached.

    Closing this generator closes the provider's HTTP response with it, so a visitor who leaves stops the generation
    (and the bill), not only the reading of it."""
    system = "\n\n".join(message["content"] for message in messages if message["role"] == "system")
    conversation = [message for message in messages if message["role"] != "system"]
    with client().beta.messages.stream(
        model=settings.VEX_MODEL,
        max_tokens=settings.VEX_MAX_OUTPUT_TOKENS,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=cast(list[BetaMessageParam], conversation),
        output_config={"effort": settings.VEX_REASONING_EFFORT},
        betas=[FALLBACK_BETA],
        fallbacks="default",
        # Read at call time rather than baked into the client, so one test can shorten it.
        timeout=TIMEOUT,
    ) as stream:
        for event in stream:
            if event.type == "message_start":
                usage.read_prompt(event.message)
            elif event.type == "text":
                yield event.text
            elif event.type == "content_block_start" and event.content_block.type == "fallback":
                # The model declined mid-answer and another takes over from the text so far, which it continues.
                logger.warning(
                    "Vex fell back from %s to %s mid-answer (category: %s)",
                    event.content_block.from_.model,
                    event.content_block.to.model,
                    event.content_block.trigger.category or "none",
                )
        message = stream.get_final_message()
    usage.read(message, settings.VEX_MODEL)
    if usage.finish_reason == "refusal":
        category = message.stop_details.category if message.stop_details else None
        raise Refused(f"{usage.model} declined to answer (category: {category or 'none'})")
    if usage.finish_reason == "max_tokens":
        # The answer the visitor got is cut off mid-thought: a cap that does this often is too low for the model.
        logger.warning(
            "Vex's answer was cut at VEX_MAX_OUTPUT_TOKENS=%d (%d output tokens, %d of them reasoning)",
            settings.VEX_MAX_OUTPUT_TOKENS,
            usage.output_tokens,
            usage.reasoning_tokens,
        )
