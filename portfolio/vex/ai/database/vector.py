from functools import lru_cache

from django.conf import settings
from langchain_community.vectorstores import PGVector
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_openai import OpenAIEmbeddings


@lru_cache(maxsize=1)
def store() -> PGVector:
    return PGVector(
        connection_string=settings.DATABASE_URL,
        collection_name=settings.VECTOR_DB_COLLECTION,
        embedding_function=OpenAIEmbeddings(model=settings.VECTOR_TEXT_EMBEDDING_MODEL),
        use_jsonb=settings.VECTOR_USE_JSONB,
    )


def retriever_topk(k: int = settings.VECTOR_RETRIEVE_K, _filter: dict | None = None) -> VectorStoreRetriever:
    return store().as_retriever(search_type="similarity", search_kwargs={"k": k, "filter": (_filter or {})})
