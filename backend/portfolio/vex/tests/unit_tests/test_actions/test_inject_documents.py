import shutil
import tempfile
from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from langchain_core.documents import Document

from vex.actions.inject_documents import InjectDocument
from vex.tests.factories import DocumentFactory


class InjectDocumentsActionTestCase(TestCase):
    def setUp(self) -> None:
        # Use a temporary MEDIA_ROOT so any created files are isolated and cleaned up
        self._tmp_media = tempfile.mkdtemp()
        self._override = self.settings(MEDIA_ROOT=self._tmp_media)
        self._override.enable()

    def tearDown(self) -> None:
        self._override.disable()
        shutil.rmtree(self._tmp_media, ignore_errors=True)

    def test_inject_from_file_marks_as_injected_and_writes_chunks(self) -> None:
        # Prepare a small text file
        content = b"This is a small test document.\nIt has multiple lines.\n"
        upload = SimpleUploadedFile("test.txt", content, content_type="text/plain")
        doc = DocumentFactory(title="Test Doc", file=upload, url=None, injected=False)

        # Mock loader to return a single Document
        with (
            patch("vex.actions.inject_documents.DocumentLoader") as Loader,
            patch("vex.actions.inject_documents.store") as store_fn,
        ):
            loader_instance = Loader.return_value
            loader_instance.load.return_value = [Document(page_content="Hello World")]  # raw docs

            vector_store = MagicMock()
            store_fn.return_value = vector_store

            InjectDocument(document=doc, chunk_size=50, chunk_overlap=0).inject()

            # mark_as_injected should be called (field flipped)
            doc.refresh_from_db()
            self.assertTrue(doc.injected)

            # Chunks were added to the vector store
            vector_store.add_documents.assert_called()
            args, kwargs = vector_store.add_documents.call_args
            self.assertTrue(args)
            self.assertGreater(len(args[0]), 0)  # at least one chunk

    def test_inject_from_url_adds_placeholder(self) -> None:
        doc = DocumentFactory(title="URL Doc", url="https://example.com/paper.pdf", file=None, injected=False)

        with patch("vex.actions.inject_documents.store") as store_fn:
            vector_store = MagicMock()
            store_fn.return_value = vector_store

            InjectDocument(document=doc).inject()
            doc.refresh_from_db()
            self.assertTrue(doc.injected)
            vector_store.add_documents.assert_called()

    def test_inject_skips_when_already_injected(self) -> None:
        doc = DocumentFactory(title="Done", url="https://example.com", file=None, injected=True)

        with patch("vex.actions.inject_documents.store") as store_fn:
            vector_store = MagicMock()
            store_fn.return_value = vector_store

            InjectDocument(document=doc).inject()
            # No additional writes expected
            vector_store.add_documents.assert_not_called()

    def test_inject_handles_no_content(self) -> None:
        doc = DocumentFactory(title="Empty", file=None, url=None, injected=False)

        with patch("vex.actions.inject_documents.store") as store_fn:
            vector_store = MagicMock()
            store_fn.return_value = vector_store

            InjectDocument(document=doc).inject()
            doc.refresh_from_db()
            self.assertFalse(doc.injected)
            vector_store.add_documents.assert_not_called()
