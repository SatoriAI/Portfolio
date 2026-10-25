from dataclasses import dataclass
from typing import Literal

from django.conf import settings

from vex.ai.knowledge import estimate_tokens
from vex.ai.provider import Usage
from vex.choices import Roles
from vex.models import Conversation, Message
from vex.utils.session import is_valid_session_key

# How much of the conversation the model reads back: the latest messages, up to this many and this many tokens. The
# knowledge base already fills the prompt; older turns cost more than they add.
HISTORY_MESSAGES = 8
HISTORY_TOKEN_BUDGET = 3000


@dataclass(frozen=True)
class Turn:
    role: Literal["user", "assistant"]
    content: str
    # On a question asked from a role or a project: where (see vex.ai.context).
    asked_from: str = ""


class MessageHistory:
    def __init__(self, session_key: str) -> None:
        # Only a key in the format this server issues may open (and so create) a conversation. The check is on the
        # format alone: any client can mint such a key, so the per-IP limits are what actually hold creation back.
        if not is_valid_session_key(session_key):
            raise ValueError("Invalid session key")
        self.conversation, created = Conversation.objects.get_or_create(session=session_key)
        if not created:
            # Its last activity, which retention counts from (vex.retention): touched as the question arrives, so a
            # purge running meanwhile cannot take a conversation that is being written to.
            self.conversation.save(update_fields=["updated_at"])

    def recent(self, *, limit: int = HISTORY_MESSAGES, budget: int = HISTORY_TOKEN_BUDGET) -> list[Turn]:
        """The latest questions and answers, oldest first: at most `limit` of them, and no more than `budget` tokens
        beyond the newest one, which is always kept."""
        latest = self.conversation.messages.filter(role__in=[Roles.USER, Roles.ASSISTANT]).order_by(
            "-created_at", "-pk"
        )[:limit]
        turns: list[Turn] = []
        spent = 0
        for message in latest:
            spent += estimate_tokens(message.content) + estimate_tokens(message.asked_from)
            if turns and spent > budget:
                break
            turns.append(
                Turn("user" if message.role == Roles.USER else "assistant", message.content, message.asked_from)
            )
        return turns[::-1]

    def add_exchange(self, question: Turn, answer: str, *, usage: Usage, prompt_version: str) -> Message:
        """Saves a question (with where it was asked, if anywhere in particular) and its answer, and returns the
        answer, which the visitor may go on to rate."""
        Message.objects.create(
            conversation=self.conversation, role=Roles.USER, content=question.content, asked_from=question.asked_from
        )
        return Message.objects.create(
            conversation=self.conversation,
            role=Roles.ASSISTANT,
            content=answer,
            model=usage.model or settings.VEX_MODEL,
            prompt_version=prompt_version,
            input_tokens=usage.input_tokens,
            cached_tokens=usage.cached_tokens,
            output_tokens=usage.output_tokens,
            truncated=usage.finish_reason == "max_tokens",
        )
