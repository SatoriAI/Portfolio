from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from vex.choices import Roles
from vex.models import Conversation, Message


class MessageHistory(BaseChatMessageHistory):
    def __init__(self, session_key: str) -> None:
        self.conversation, _ = Conversation.objects.get_or_create(session=session_key)

    @property
    def messages(self) -> list[BaseMessage]:
        out = []

        for message in self.conversation.messages.order_by("created_at").iterator():
            match message.role:
                case Roles.USER:
                    method = HumanMessage
                case Roles.ASSISTANT:
                    method = AIMessage
                case _:
                    method = SystemMessage
            out.append(method(message.content))

        return out

    def add_message(self, message) -> None:
        match message.type:
            case "ai":
                role = Roles.ASSISTANT
            case "human":
                role = Roles.USER
            case _:
                role = Roles.SYSTEM
        Message.objects.create(conversation=self.conversation, role=role, content=message.content)

    def clear(self) -> None:
        self.conversation.messages.all().delete()
