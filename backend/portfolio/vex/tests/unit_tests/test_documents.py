import importlib
import shutil
import tempfile
from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch

import pymupdf
from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.db import connection
from django.http import HttpResponse
from django.test import TestCase, override_settings
from django.urls import reverse

from vex.models import Document
from vex.tests.factories import DocumentFactory
from vex.utils.document_text import UnreadableDocument, extract_text

backfill_migration = importlib.import_module("vex.migrations.0009_document_content_backfill")


def pdf_bytes(*pages: str) -> bytes:
    pdf = pymupdf.open()
    for text in pages:
        pdf.new_page().insert_text((72, 72), text)
    data = pdf.tobytes()
    pdf.close()
    return bytes(data)


class MediaRootMixin(TestCase):
    def setUp(self) -> None:
        media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media, ignore_errors=True)
        override = override_settings(
            MEDIA_ROOT=media,
            STORAGES={
                "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
                # The admin pages link their stylesheets; with DEBUG off the manifest would need a collectstatic.
                "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
            },
        )
        override.enable()
        self.addCleanup(override.disable)


class ExtractTextTestCase(TestCase):
    def test_reads_every_page_of_a_pdf(self) -> None:
        self.assertEqual(extract_text("Bio.PDF", pdf_bytes("First page", "Second page")), "First page\n\nSecond page")

    def test_reads_anything_else_as_text(self) -> None:
        self.assertEqual(extract_text("notes.md", "  Zażółć\n".encode()), "Zażółć")

    def test_a_file_with_no_text_to_read_is_refused(self) -> None:
        for name, data in (("broken.pdf", b"not a pdf"), ("scan.pdf", pdf_bytes("")), ("empty.txt", b"  \n")):
            with self.subTest(name=name), self.assertRaises(UnreadableDocument):
                extract_text(name, data)


class DocumentAdminTestCase(MediaRootMixin):
    def setUp(self) -> None:
        super().setUp()
        user = get_user_model().objects.create_superuser("admin", "admin@example.com", "pass")
        self.client.force_login(user)

    def post(self, document: Document | None = None, status: int = 302, **fields: object) -> HttpResponse:
        url = (
            reverse("admin:vex_document_change", args=[document.pk]) if document else reverse("admin:vex_document_add")
        )
        data = {"title": "Favourites", "language": "en", "description": "", "url": "", "content": ""} | fields
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status)
        return response

    def test_an_uploaded_file_becomes_the_text_vex_reads(self) -> None:
        self.post(file=SimpleUploadedFile("favourites.pdf", pdf_bytes("Favourite dish: shakshuka")))
        self.assertEqual(Document.objects.get().content, "Favourite dish: shakshuka")

    def test_text_edited_in_the_same_save_wins_over_the_file(self) -> None:
        self.post(file=SimpleUploadedFile("notes.txt", b"From the file"), content="Typed by hand")
        self.assertEqual(Document.objects.get().content, "Typed by hand")

    def test_a_file_with_no_text_is_a_form_error_and_saves_nothing(self) -> None:
        response = self.post(status=200, file=SimpleUploadedFile("scan.pdf", b"not really a pdf"))
        self.assertIn("No text could be read from this file", response.content.decode())
        self.assertFalse(Document.objects.exists())

    def test_the_list_shows_and_filters_documents_without_text(self) -> None:
        DocumentFactory(title="Filled", content="Shakshuka.", url=None)
        DocumentFactory(title="Hollow", content="", url=None)
        url = reverse("admin:vex_document_changelist")
        self.assertContains(self.client.get(url), "Text for Vex")
        empty = self.client.get(url, {"has_text": "no"}).content.decode()
        self.assertIn("Hollow", empty)
        self.assertNotIn("Filled", empty)

    def test_saving_without_a_new_file_keeps_the_text(self) -> None:
        document = DocumentFactory(file=ContentFile(b"From the file", name="notes.txt"), content="Edited", url=None)
        self.post(document, content="Edited", title="Renamed")
        document.refresh_from_db()
        self.assertEqual((document.title, document.content), ("Renamed", "Edited"))


class BackfillMigrationTestCase(MediaRootMixin):
    """The data migration that gives each document its text, run against this database's documents."""

    def run_backfill(self) -> None:
        backfill_migration.backfill(apps, SimpleNamespace(connection=connection))

    def make_legacy_table(self, rows: list[tuple[str, str]]) -> None:
        with connection.cursor() as cursor:
            cursor.execute("CREATE TABLE langchain_pg_embedding (document varchar, cmetadata jsonb)")
            for document, metadata in rows:
                cursor.execute("INSERT INTO langchain_pg_embedding VALUES (%s, %s)", [document, metadata])

    def test_a_document_gets_the_text_of_its_file(self) -> None:
        document = DocumentFactory(file=ContentFile(pdf_bytes("Shakshuka"), name="fav.pdf"), content="", url=None)
        self.run_backfill()
        document.refresh_from_db()
        self.assertEqual(document.content, "Shakshuka")

    def test_a_document_without_a_file_gets_its_old_chunks_back_in_page_order(self) -> None:
        document = DocumentFactory(file=None, content="", url=None)
        other = DocumentFactory(file=None, content="Typed in the admin", url=None)
        pk = document.pk
        self.make_legacy_table(
            [
                ("Page two starts here.", f'{{"document_pk": {pk}, "page": 1}}'),
                ("Favourite dishes: shakshuka and pad thai", f'{{"document_pk": {pk}, "page": 0}}'),
                ("shakshuka and pad thai\nFavourite drink: water", f'{{"document_pk": {pk}, "page": 0}}'),
                ("Someone else's text", f'{{"document_pk": {other.pk}, "page": 0}}'),
            ]
        )
        self.run_backfill()
        document.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(
            document.content,
            "Favourite dishes: shakshuka and pad thai\nFavourite drink: water\nPage two starts here.",
        )
        self.assertEqual(other.content, "Typed in the admin")

    def test_a_document_with_nothing_to_read_is_reported_and_left_empty(self) -> None:
        document = DocumentFactory(file=None, content="", url=None, title="Nothing")
        with self.assertLogs(backfill_migration.__name__, level="WARNING") as logs:
            self.run_backfill()
        document.refresh_from_db()
        self.assertEqual(document.content, "")
        self.assertIn("Nothing", "\n".join(logs.output))

    def test_a_broken_legacy_table_does_not_stop_the_migration(self) -> None:
        DocumentFactory(file=None, content="", url=None)
        with connection.cursor() as cursor:
            cursor.execute("CREATE TABLE langchain_pg_embedding (document varchar, cmetadata varchar)")
        with self.assertLogs(backfill_migration.__name__, level="WARNING") as logs:
            self.run_backfill()
        self.assertIn("could not read its old chunks", "\n".join(logs.output))


@override_settings(VEX_SITE_CONTENT_URL="")
class VexKbCommandTestCase(TestCase):
    def test_reports_the_sources_and_their_size(self) -> None:
        DocumentFactory(title="Favourites", language="pl", content="Shakshuka.", url=None, description="")
        out = StringIO()
        call_command("vex_kb", "--locale", "pl", stdout=out)
        report = out.getvalue()
        self.assertIn("Favourites", report)
        self.assertIn("locale pl, 1 sources", report)
        self.assertIn("site content NOT loaded", report)

    def test_dumps_the_system_prompt(self) -> None:
        out = StringIO()
        with patch("vex.management.commands.vex_kb.system_prompt", return_value="THE PROMPT"):
            call_command("vex_kb", "--dump", stdout=out)
        self.assertEqual(out.getvalue().strip(), "THE PROMPT")
