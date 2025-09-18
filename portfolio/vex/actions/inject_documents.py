import logging

from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from vex.ai.database.vector import store
from vex.models import Document as VexDocument
from vex.utils.document_loader import DocumentLoader

logger = logging.getLogger(__name__)


@admin.action(description=_("Inject Document(s) to Vector Database"))
def run_inject_documents(model_admin: ModelAdmin, request: HttpRequest, queryset: QuerySet) -> None:
    for document in queryset:
        injector = InjectDocument(document=document)
        injector.inject()

    model_admin.message_user(request, _("Document(s) injected successfully."))


class InjectDocument:
    DOCUMENT_LOADER = DocumentLoader

    def __init__(self, document: VexDocument, *, chunk_size: int = 1200, chunk_overlap: int = 150) -> None:
        self.document = document

        self._chunk_size = chunk_size
        self._chunk_overlap = chunk_overlap

    def inject(self) -> None:
        logger.info("Injecting Document %s", self.document.pk)

        if self.document.injected:
            logger.info("Document %s already injected", self.document.pk)
            return

        if file := self.document.file:
            logger.debug("Injecting Document from a file: %s", file)
            loader = self.DOCUMENT_LOADER(path=file.path)
            raw = loader.load()
        elif url := self.document.url:
            logger.debug("Injecting Document from an URL: %s", url)
            raw = [Document(page_content=f"URL: {url}", metadata={"source": url})]
        else:
            logger.error("Document %s does not contain any content", self.document.pk)
            return

        self._make_injection(raw=raw)

        logger.info("Injected Document %s", self.document.pk)
        self.document.mark_as_injected()

    def _make_injection(self, raw: list[Document]) -> None:
        logger.debug("#%s Documents loaded", len(raw))

        for d in raw:
            d.metadata = {**(d.metadata or {}), "document_pk": self.document.pk, "title": self.document.title}

        chunks = self._chunk(raw=raw)
        logger.debug("#%s Chunks prepared", len(raw))
        if not chunks:
            return

        for c in chunks:
            c.metadata = {**(c.metadata or {}), "locale": self.document.language}

        vector_store = store()
        vector_store.add_documents(chunks)

    def _chunk(self, raw: list[Document]) -> list[Document]:
        splitter = RecursiveCharacterTextSplitter(chunk_size=self._chunk_size, chunk_overlap=self._chunk_overlap)
        return splitter.split_documents(list(raw))
