import stanza
from django.conf import settings
from django.db import models
from langchain_core.documents import Document

from work.models import Experience, Project, Skill

STANZA_PIPELINES: dict[str, stanza.Pipeline] = {}


def get_pipeline(locale: str) -> stanza.Pipeline | None:
    try:
        if locale not in STANZA_PIPELINES:
            STANZA_PIPELINES[locale] = stanza.Pipeline(
                lang=locale, processors="tokenize,lemma", use_gpu=False, tokenize_pretokenized=False
            )
    except Exception:  # pylint: disable=broad-exception-caught
        pass
    return STANZA_PIPELINES.get(locale)


def tokenize(question: str, locale: str) -> set[str]:
    pipeline = get_pipeline(locale=locale)
    if not pipeline:
        return set((question or "").lower().split())
    try:
        doc = pipeline(question)
        lemmas: set[str] = set()
        for sentence in doc.sentences:
            for word in sentence.words:
                lemma = (word.lemma or "").lower()
                if lemma:
                    lemmas.add(lemma)
        return lemmas
    except Exception:  # pylint: disable=broad-exception-caught
        return set((question or "").lower().split())


class RelationalContextGetter:
    LEXICON_BY_LOCALE: dict[str, dict[type[models.Model], list[str]]] = {
        "en": {
            Skill: ["skill", "skills", "stack", "tech", "technologies"],
            Project: ["project", "projects", "portfolio", "repo", "repositories"],
            Experience: ["experience", "work", "employment", "career", "job", "jobs"],
        },
        "pl": {
            Skill: ["umiejętność", "umiejętności", "stack", "technologie", "tech"],
            Project: ["projekt", "projekty", "portfolio", "repozytorium", "repozytoria"],
            Experience: [
                "doświadczenie",
                "praca",
                "zatrudnienie",
                "kariera",
                "stanowisko",
                "firma",
            ],
        },
    }

    def __init__(self, question: str, *, locale: str = settings.LANGUAGE_CODE, limit_per_model: int = 10) -> None:
        self.question = question.lower()
        self._locale = locale
        self._limit_per_model = limit_per_model

    def get_context(self) -> list[Document]:
        documents: list[Document] = []

        for model in self._get_requirements():
            for obj in model.objects.all()[: self._limit_per_model]:  # type: ignore
                documents.append(Document(page_content=obj.representation_for(self._locale)))

        return documents

    def _get_requirements(self) -> list[type["models.Model"]]:
        requirements: list[type[models.Model]] = []
        lexicon: dict[type[models.Model], list[str]] = self.LEXICON_BY_LOCALE.get(self._locale, {})

        lemmas = tokenize(question=self.question, locale=self._locale)

        for model, vocabulary in lexicon.items():
            if any(word in lemmas for word in vocabulary):
                requirements.append(model)

        return requirements
