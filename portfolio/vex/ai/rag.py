from collections.abc import Callable
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


class RagChain:
    RELATIONAL_CONTEXT_GETTER = RelationalContextGetter

    def __init__(self) -> None:
        self.llm = ChatOpenAI(model=settings.OPENAI_MODEL, temperature=settings.TEMPERATURE)

    @property
    def prompt(self) -> ChatPromptTemplate:
        return ChatPromptTemplate.from_messages(
            [
                ("system", settings.SYSTEM_PROMPT.strip()),
                MessagesPlaceholder("history"),
                ("user", "Question: {question}\nContext: {context}"),
            ]
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

        if getattr(settings, "RAG_DUMP_CONTEXTS", False):
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
            filename = dump_dir / f"{datetime.now().strftime("%Y/%m/%dT%H:%M%:%S")}.txt"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"Locale: {locale}\nQuestion: {question}\n\n")
                f.write(merged)
        except Exception:  # pylint: disable=broad-exception-caught
            pass


def build_rag_chain() -> RunnableWithMessageHistory:
    pipeline = RagChain()
    return pipeline.build()


rag_chain = build_rag_chain()
