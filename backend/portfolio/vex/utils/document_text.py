class UnreadableDocument(ValueError):
    """A file with no text to read: a PDF that is broken or only scanned pages, or an empty file."""


def extract_text(name: str, data: bytes) -> str:
    """The text of an uploaded document: a PDF's pages read with PyMuPDF (which keeps the ligatures and emoji that
    simpler readers drop), anything else read as UTF-8. Raises UnreadableDocument when there is no text to be had."""
    if name.lower().endswith(".pdf"):
        # Imported here, not at the top: PyMuPDF is 83 MB resident once loaded, about a third of the whole process,
        # and only an admin uploading a PDF ever needs it. `vex.admin` imports this module at start-up.
        import pymupdf  # pylint: disable=import-outside-toplevel

        try:
            with pymupdf.open(stream=data, filetype="pdf") as pdf:
                text = "\n".join(page.get_text() for page in pdf).strip()
        except pymupdf.FileDataError as error:
            raise UnreadableDocument(f"{name} is not a PDF that can be read ({error})") from error
    else:
        text = data.decode("utf-8", errors="ignore").strip()
    if not text:
        raise UnreadableDocument(f"{name} has no text in it")
    return text
