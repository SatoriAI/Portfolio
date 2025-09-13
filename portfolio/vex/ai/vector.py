import os
from functools import lru_cache

from langchain_community.vectorstores import PGVector
from langchain_openai import OpenAIEmbeddings

COLLECTION = os.getenv("PORTFOLIO_COLLECTION", "portfolio")
CONN = os.environ["DATABASE_URL"]


@lru_cache(maxsize=1)
def store():
    return PGVector(
        connection_string=CONN,
        collection_name=COLLECTION,
        embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"),
        use_jsonb=True,
    )


def retriever_topk(k: int = 6, _filter=None):
    return store().as_retriever(search_type="similarity", search_kwargs={"k": k, "filter": (_filter or {})})
