import logging
import os

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class DocumentLoader:
    def __init__(self, path: str) -> None:
        self.path = path

    @property
    def extension(self) -> str:
        return os.path.splitext(self.path)[1].lower()

    def load(self) -> list[Document]:
        logger.info("Loading Document from %s with extension %s", self.path, self.extension)

        match self.extension:
            case ".pdf":
                return self._load_pdf()
            case _:
                return self._load_plain_text()

    def _load_pdf(self) -> list[Document]:
        try:
            documents = PyMuPDFLoader(self.path).load()
        except Exception as exception:  # pylint: disable=broad-exception-caught
            logger.error("Error while loading PDF. Exception: %s", exception)
            return []
        return [d for d in documents if (d.page_content or "").strip()]

    def _load_plain_text(self) -> list[Document]:
        try:
            with open(self.path, encoding="utf-8", errors="ignore") as f:
                return [Document(page_content=f.read(), metadata={"source": self.path})]
        except Exception as exception:  # pylint: disable=broad-exception-caught
            logger.exception("Error while loading plain text. Exception: %s", exception)
            return []
