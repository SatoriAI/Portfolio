import pymupdf


def extract_text(name: str, data: bytes) -> str:
    """The text of an uploaded document: a PDF's pages read with PyMuPDF (which keeps the ligatures and emoji that
    simpler readers drop), anything else read as UTF-8."""
    if name.lower().endswith(".pdf"):
        with pymupdf.open(stream=data, filetype="pdf") as pdf:
            return "\n".join(page.get_text() for page in pdf).strip()
    return data.decode("utf-8", errors="ignore").strip()
