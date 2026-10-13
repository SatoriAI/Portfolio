"""Everything Vex knows, as one text per language, given to the model whole on every question.

All of it fits in the prompt (tens of thousands of tokens), so nothing is retrieved: the model reads the lot, and
OpenAI's prompt cache makes the repeat cheap. That holds only while the text is identical from one question to the
next, so it is assembled deterministically, in a fixed order with what changes least first: the uploaded documents,
then the site's own pages, then the database rows the admin edits."""

import hashlib
import logging
import math
import threading
import time
from dataclasses import dataclass
from html import escape
from typing import Any, Literal

import httpx
from django.conf import settings
from django.db import models

from university.models import Publication, School, Testimonial
from vex.models import Document
from work.models import Experience, Project, Skill

logger = logging.getLogger(__name__)

# How long a built knowledge base is reused. An edit in the admin, or a deploy of the site, reaches Vex within this.
TTL_SECONDS = 300
# The site's content is fetched from the frontend; a slow or absent frontend costs one question this long at most,
# and then Vex answers from the database until the next rebuild.
SITE_TIMEOUT = httpx.Timeout(5, connect=2)
SITE_MAX_BYTES = 4_000_000

# The rows Vex reads, as each model exposes them (vex_queryset, representation_for), with the page that shows them.
DATABASE_SECTIONS: tuple[tuple[type[models.Model], str, str, tuple[str, ...]], ...] = (
    (Experience, "/experience", "Work experience", ("-start", "pk")),
    (Skill, "/experience", "Skills", ("pk",)),
    (Project, "/#projects", "Projects", ("pk",)),
    (School, "/education", "Education", ("-start", "pk")),
    (Publication, "/research", "Publications", ("-year", "pk")),
    (Testimonial, "/education", "What students say about Dawid's teaching", ("pk",)),
)

Kind = Literal["document", "site", "database"]


def estimate_tokens(text: str) -> int:
    """A rough count, at about four characters a token: enough to budget a prompt, never to bill one."""
    return math.ceil(len(text) / 4)


@dataclass(frozen=True)
class Source:
    kind: Kind
    title: str
    text: str
    path: str = ""

    def render(self) -> str:
        # A source's text is data. Closing tags inside it are broken up, so no text can end its source early and
        # pass the rest off as something else.
        body = self.text.strip().replace("</source", "<\\/source").replace("</knowledge", "<\\/knowledge")
        path = f' path="{escape(self.path)}"' if self.path else ""
        return f'<source{path} title="{escape(self.title)}">\n{body}\n</source>'


@dataclass(frozen=True)
class KnowledgeBase:
    locale: str
    sources: tuple[Source, ...]
    # Whether the site's pages are in it; without them Vex knows only the database and the documents.
    site_loaded: bool

    @property
    def text(self) -> str:
        return "\n\n".join(source.render() for source in self.sources)

    @property
    def digest(self) -> str:
        return hashlib.sha256(self.text.encode()).hexdigest()[:12]


def document_sources(locale: str) -> list[Source]:
    sources = []
    for document in Document.objects.filter(language=locale).order_by("pk"):
        parts = [document.description or "", document.content]
        # A URL document was never fetched (the old pipeline stored only its address); Vex can still point to it.
        if document.url:
            parts.append(f"Link: {document.url}")
        text = "\n\n".join(part.strip() for part in parts if part and part.strip())
        if text:
            sources.append(Source("document", document.title, text))
    return sources


def database_sources(locale: str) -> list[Source]:
    sources = []
    for model, path, title, ordering in DATABASE_SECTIONS:
        queryset = model.vex_queryset().order_by(*ordering)  # type: ignore[attr-defined]
        if hasattr(model, "translations"):
            queryset = queryset.prefetch_related("translations")
        text = "\n\n".join(row.representation_for(locale) for row in queryset)
        if text:
            sources.append(Source("database", title, text, path))
    return sources


# The last copy of the site's content that arrived whole, per locale: a failed fetch keeps answering from it.
_site_cache: dict[str, list[Source]] = {}


def site_sources(locale: str) -> list[Source] | None:
    """The site's Markdown (project write-ups, workshop pieces), as the frontend's build publishes it for Vex. None
    when it cannot be had: no URL configured, or a fetch that fails with nothing fetched before it."""
    base = settings.VEX_SITE_CONTENT_URL.rstrip("/")
    if not base:
        return None
    url = f"{base}/vex-kb/{locale}.json"
    try:
        response = httpx.get(url, timeout=SITE_TIMEOUT, follow_redirects=True)
        response.raise_for_status()
        if len(response.content) > SITE_MAX_BYTES:
            raise ValueError(f"{len(response.content)} bytes is over the {SITE_MAX_BYTES} limit")
        sources = parse_site_bundle(response.json())
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("Vex could not read the site's content from %s: %s", url, error)
        return _site_cache.get(locale)
    _site_cache[locale] = sources
    return sources


def parse_site_bundle(bundle: Any) -> list[Source]:
    """The sources in the frontend's bundle, `{"sources": [{"path", "title", "text"}, …]}`, skipping any entry that
    is not of that shape."""
    if not isinstance(bundle, dict) or not isinstance(bundle.get("sources"), list):
        raise ValueError("not a Vex content bundle")
    sources = []
    for entry in bundle["sources"]:
        if not isinstance(entry, dict):
            continue
        path, title, text = entry.get("path"), entry.get("title"), entry.get("text")
        if isinstance(path, str) and isinstance(title, str) and isinstance(text, str) and text.strip():
            sources.append(Source("site", title, text, path))
    return sources


def build(locale: str) -> KnowledgeBase:
    site = site_sources(locale)
    return KnowledgeBase(
        locale=locale,
        sources=(*document_sources(locale), *(site or []), *database_sources(locale)),
        site_loaded=site is not None,
    )


_cache: dict[str, tuple[float, KnowledgeBase]] = {}
# One lock per language, so rebuilding one never holds up a question in the other.
_locks = {code: threading.Lock() for code, _name in settings.LANGUAGES}


def knowledge_base(locale: str) -> KnowledgeBase:
    """The knowledge base for `locale`, rebuilt at most once every TTL_SECONDS per process."""
    with _locks[locale]:
        cached = _cache.get(locale)
        if cached is not None and time.monotonic() - cached[0] < TTL_SECONDS:
            return cached[1]
        # Built under the lock: the threads that arrive meanwhile wait for this build rather than each running one.
        knowledge = build(locale)
        _cache[locale] = (time.monotonic(), knowledge)
        return knowledge


def clear_cache() -> None:
    _cache.clear()
    _site_cache.clear()
