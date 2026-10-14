"""Gives each document the text Vex now reads (Document.content, added empty in 0008), where it has none yet.

Vex no longer searches the old vector store, so a document's text has to live on the document. It comes from the
uploaded file where one is stored, and otherwise from the chunks the old pipeline embedded (langchain_pg_embedding),
put back together in page order. Only empty content is written: nothing typed in the admin is replaced. A document
that yields nothing is left empty and reported, never failed on: the deploy goes ahead, and the admin can fill it.

The extraction is written out here rather than imported, so later changes to the app cannot change what this did."""

import logging

from django.db import migrations, transaction

logger = logging.getLogger(__name__)

LEGACY_TABLE = "langchain_pg_embedding"


def text_of_file(document) -> str:
    if not document.file:
        return ""
    with document.file.open("rb") as file:
        data = file.read()
    if document.file.name.lower().endswith(".pdf"):
        import pymupdf  # pylint: disable=import-outside-toplevel

        with pymupdf.open(stream=data, filetype="pdf") as pdf:
            return "\n".join(page.get_text() for page in pdf).strip()
    return data.decode("utf-8", errors="ignore").strip()


def stitch(chunks: list[str]) -> str:
    """Chunks written with an overlap (each began with the end of the one before), joined without the repeats."""
    text = ""
    for chunk in chunks:
        overlap = next(
            (size for size in range(min(len(text), len(chunk), 400), 19, -1) if text.endswith(chunk[:size])), 0
        )
        text = f"{text}\n{chunk}" if text and not overlap else text + chunk[overlap:]
    return text.strip()


def text_of_legacy_chunks(connection, document_pk: int) -> str:
    if LEGACY_TABLE not in connection.introspection.table_names():
        return ""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT document FROM langchain_pg_embedding WHERE cmetadata->>'document_pk' = %s "
            "ORDER BY COALESCE((cmetadata->>'page')::int, 0), ctid",
            [str(document_pk)],
        )
        return stitch([row[0] for row in cursor.fetchall() if row[0]])


def backfill(apps, schema_editor) -> None:
    Document = apps.get_model("vex", "Document")
    for document in Document.objects.filter(content=""):
        text = ""
        try:
            text = text_of_file(document)
        except Exception as error:  # pylint: disable=broad-exception-caught
            logger.warning("Document %s: could not read its file (%s)", document.pk, error)
        if not text:
            try:
                # In a savepoint: a query that fails here must not abort the migration's transaction.
                with transaction.atomic(using=schema_editor.connection.alias):
                    text = text_of_legacy_chunks(schema_editor.connection, document.pk)
            except Exception as error:  # pylint: disable=broad-exception-caught
                logger.warning("Document %s: could not read its old chunks (%s)", document.pk, error)
        if text:
            Document.objects.filter(pk=document.pk).update(content=text)
        else:
            logger.warning("Document %s (%s) has no text for Vex; fill it in the admin", document.pk, document.title)


class Migration(migrations.Migration):
    dependencies = [
        ("vex", "0008_knowledge_engine"),
    ]

    # Reversing 0008 drops the column, and the text with it; there is nothing for this one to undo.
    operations = [
        migrations.RunPython(backfill, reverse_code=migrations.RunPython.noop),
    ]
