from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from operator import itemgetter
from pathlib import Path
from typing import Any

from django.conf import settings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableSerializable
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI

from vex.ai.database.relational import RelationalContextGetter
from vex.ai.database.vector import retriever_topk
from vex.ai.history import MessageHistory
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
        self.llm = ChatOpenAI(model=self.config.model, temperature=self.config.temperature)

    @staticmethod
    def _get_config() -> RagConfig | Configuration:
        if db_config := Configuration.objects.first():
            return db_config

        return RagConfig(
            model="gpt-4o-mini",
            temperature=0.5,
            system_prompt="You are a helpful assistant.",
            user_prompt="Question: {question}\nContext: {context}",
        )

    def build(self) -> RunnableWithMessageHistory:
        return RunnableWithMessageHistory(
            self._get_core(),
            self._get_history_factory(),
            input_messages_key="question",
            history_messages_key="history",
        )

    def _get_core(self) -> RunnableSerializable[dict[str, Any], str]:
        return RunnablePassthrough.assign(context=self._merge_context) | self.prompt | self.llm | StrOutputParser()

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
            f"[{i+1}] {d.page_content}" for i, d in enumerate((vector_docs or []) + (structured_docs or []))
        )

        if settings.RAG_DUMP_CONTEXTS:
            self._save_context_to_file(question=question, locale=locale, merged=merged)

        return merged

    @staticmethod
    def _get_history_factory() -> Callable[[str | None], MessageHistory]:
        def history_factory(session_key: str | None) -> MessageHistory:
            if not session_key:
                raise ValueError("Missing session key! Cannot retrieve chat history!")
            return MessageHistory(session_key)

        return history_factory

    @staticmethod
    def _save_context_to_file(question: str, locale: str, merged: str) -> None:
        try:
            dump_dir = Path(settings.RAG_CONTEXT_DUMP_DIR)
            if not dump_dir.exists():
                dump_dir.mkdir(parents=True, exist_ok=True)
            filename = dump_dir / f"{datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}.txt"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"Locale: {locale}\nQuestion: {question}\n\n")
                f.write(merged)
        except Exception:  # pylint: disable=broad-exception-caught
            pass


def build_rag_chain() -> RunnableWithMessageHistory:
    pipeline = RagChain()
    return pipeline.build()


rag_chain = build_rag_chain()
