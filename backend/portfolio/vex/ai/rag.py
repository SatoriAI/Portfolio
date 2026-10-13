from collections.abc import Generator
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime
from operator import itemgetter
from pathlib import Path
from typing import Any, cast

from django.conf import settings
from django.db import transaction
from langchain_core.messages import AIMessage, BaseMessageChunk, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI

from vex.ai.database.relational import RelationalContextGetter
from vex.ai.database.vector import retriever_topk
from vex.ai.history import MessageHistory
from vex.ai.provider import MAX_RETRIES, TIMEOUT
from vex.models import Configuration


@dataclass
class RagConfig:
    model: str
    temperature: float
    system_prompt: str
    user_prompt: str

    def safe_translation_getter(self, field: str, **kwargs: str) -> str:
        if field == "system_prompt":
            return self.system_prompt
        if field == "user_prompt":
            return self.user_prompt
        raise AttributeError(f"Unknown translatable field: {field}")


class RagChain:
    RELATIONAL_CONTEXT_GETTER = RelationalContextGetter

    def __init__(self) -> None:
        self.config = self._get_config()
        self.llm = ChatOpenAI(
            model=self.config.model, temperature=self.config.temperature, timeout=TIMEOUT, max_retries=MAX_RETRIES
        )

    @staticmethod
    def _get_config() -> RagConfig | Configuration:
        db_config: Configuration | None = None
        try:
            db_config = Configuration.objects.first()
        except Exception:  # pylint: disable=broad-exception-caught
            db_config = None
        if db_config is not None:
            return db_config
        return RagConfig(
            model="gpt-4o-mini",
            temperature=0.5,
            system_prompt="You are a helpful assistant.",
            user_prompt="Question: {question}\nContext: {context}",
        )

    def stream(self, inputs: dict[str, Any]) -> Generator[str]:
        """The model's answer to `inputs`, as text chunks.

        The model is streamed on its own rather than as the last step of one LangChain pipeline: a pipeline's stream
        swallows GeneratorExit and reads its input to the end, so closing it would still receive (and pay for) the
        whole answer. Closing this generator closes the model's stream, and with it the provider's HTTP response."""
        values = RunnablePassthrough.assign(context=self._merge_context).invoke(inputs)
        prompt = self.prompt(values).invoke(values)
        # BaseChatModel.stream is a generator, typed as a plain Iterator.
        with closing(cast(Generator[BaseMessageChunk], self.llm.stream(prompt))) as chunks:
            for chunk in chunks:
                if isinstance(chunk.content, str) and chunk.content:
                    yield chunk.content

    def prompt(self, values: dict[str, Any]) -> ChatPromptTemplate:
        locale = values.get("locale") or settings.LANGUAGE_CODE

        system_prompt = self.config.safe_translation_getter("system_prompt", language_code=locale).strip()
        user_prompt = self.config.safe_translation_getter("user_prompt", language_code=locale).strip()

        return ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder("history"),
                ("user", user_prompt),
            ]
        )

    def _merge_context(self, context: dict) -> str:
        question = context["question"]
        locale = context["locale"]

        # Extract documents from Vector DB
        active_retriever = retriever_topk(_filter={"locale": locale})
        vector_docs = (itemgetter("question") | active_retriever).invoke(context)

        # Extract documents from PostgreSQL
        relational_getter = self.RELATIONAL_CONTEXT_GETTER(question=question, locale=locale)
        structured_docs = relational_getter.get_context()

        merged = "\n\n".join(
            f"[{i + 1}] {d.page_content}" for i, d in enumerate((vector_docs or []) + (structured_docs or []))
        )

        if settings.RAG_DUMP_CONTEXTS:
            self._save_context_to_file(question=question, locale=locale, merged=merged)

        return merged

    @staticmethod
    def _save_context_to_file(question: str, locale: str, merged: str) -> None:
        dump_dir = Path(settings.RAG_CONTEXT_DUMP_DIR)
        if not dump_dir.exists():
            dump_dir.mkdir(parents=True, exist_ok=True)
        filename = dump_dir / f"{datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"Locale: {locale}\nQuestion: {question}\n\n")
            f.write(merged)


_rag_chain: RagChain | None = None


def get_rag_chain() -> RagChain:
    global _rag_chain  # pylint: disable=global-statement
    if _rag_chain is None:
        _rag_chain = RagChain()
    return _rag_chain


def stream_answer(question: str, locale: str, session_key: str) -> Generator[str]:
    """The answer to one question in a conversation, as text chunks, and the only way the API reaches the model.

    The exchange is saved once the answer is complete, and only then. An answer cut short (the visitor left, the
    provider failed, the stream ran out of time) saves nothing, so the history the model reads back never holds half
    a turn, and the question and its answer are saved together or not at all. Closing this generator closes the
    model's stream with it (see RagChain.stream), which closes the provider's response: a visitor who leaves stops
    the generation, not only the reading of it."""
    history = MessageHistory(session_key)
    answer: list[str] = []
    inputs = {"question": question, "locale": locale, "history": history.messages}
    with closing(get_rag_chain().stream(inputs)) as chunks:
        for chunk in chunks:
            if chunk:
                answer.append(chunk)
                yield chunk
    with transaction.atomic():
        history.add_messages([HumanMessage(question), AIMessage("".join(answer))])
