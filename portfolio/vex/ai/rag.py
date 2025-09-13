from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI

from vex.ai.history import MessageHistory
from vex.ai.vector import retriever_topk

SYSTEM = (
    "You are a helpful assistant for Dawid Hanrahan's personal portfolio. "
    "Answer strictly using the retrieved context; if unsure, say you don't know. "
    "Cite sources as [1], [2] based on the context order."
)


def _format_docs(docs):
    return "\n\n".join(f"[{i+1}] {d.page_content}" for i, d in enumerate(docs))


def build_rag_chain():
    retriever = retriever_topk(k=6)
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM), MessagesPlaceholder("history"), ("user", "Question: {question}\n\nContext:\n{context}")]
    )

    core = {"question": RunnablePassthrough(), "context": retriever | _format_docs} | prompt | llm | StrOutputParser()

    def history_factory(cfg):
        return MessageHistory(cfg["configurable"]["session_id"])

    return RunnableWithMessageHistory(
        core, history_factory, input_messages_key="question", history_messages_key="history"
    )


rag_chain = build_rag_chain()
