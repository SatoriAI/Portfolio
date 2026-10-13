"""The one place Vex reaches OpenAI. The SDK's types stop here: callers pass plain role/content messages and read
plain text back, with the call's token counts in a Usage of their own."""

from collections.abc import Generator, Sequence
from dataclasses import dataclass
from functools import lru_cache
from typing import Literal, TypedDict, cast

from django.conf import settings
from openai import OpenAI, Timeout
from openai.types import CompletionUsage
from openai.types.chat import ChatCompletionMessageParam
from openai.types.shared import ReasoningEffort

# How long a call to OpenAI may take. Without these the client waits ten minutes on a provider that stops sending,
# and retries twice more on top. The read timeout bounds each wait for the next chunk, so a stalled answer fails
# within half a minute instead of holding a server thread.
TIMEOUT = Timeout(30, connect=5)
MAX_RETRIES = 1


class ChatMessage(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str


@dataclass
class Usage:
    """What one answer cost, in tokens. Filled in as the stream ends; zero for an answer cut short."""

    input_tokens: int = 0
    cached_tokens: int = 0
    output_tokens: int = 0
    reasoning_tokens: int = 0

    def read(self, usage: CompletionUsage) -> None:
        self.input_tokens = usage.prompt_tokens
        self.output_tokens = usage.completion_tokens
        if details := usage.prompt_tokens_details:
            self.cached_tokens = details.cached_tokens or 0
        if output := usage.completion_tokens_details:
            self.reasoning_tokens = output.reasoning_tokens or 0


@lru_cache(maxsize=1)
def client() -> OpenAI:
    """One client per process, so its connections are reused. An empty key falls back to OPENAI_API_KEY in the
    environment, as the SDK does by default (and as the tests' fake provider relies on)."""
    return OpenAI(api_key=settings.OPENAI_API_KEY or None, timeout=TIMEOUT, max_retries=MAX_RETRIES)


def stream_completion(messages: Sequence[ChatMessage], *, cache_key: str, usage: Usage) -> Generator[str]:
    """The model's reply to `messages`, as text chunks, with its token counts written to `usage` at the end.

    Closing this generator closes the provider's HTTP response with it, so a visitor who leaves stops the generation
    (and the bill), not only the reading of it. `cache_key` groups requests that share a prompt prefix, so OpenAI
    routes them to the same prompt cache."""
    stream = client().chat.completions.create(
        model=settings.VEX_MODEL,
        messages=cast(list[ChatCompletionMessageParam], list(messages)),
        stream=True,
        stream_options={"include_usage": True},
        max_completion_tokens=settings.VEX_MAX_OUTPUT_TOKENS,
        reasoning_effort=cast(ReasoningEffort, settings.VEX_REASONING_EFFORT),
        prompt_cache_key=cache_key,
        # Read at call time rather than baked into the client, so one test can shorten it.
        timeout=TIMEOUT,
    )
    with stream:
        for chunk in stream:
            if chunk.usage is not None:
                usage.read(chunk.usage)
            for choice in chunk.choices:
                if choice.delta.content:
                    yield choice.delta.content
