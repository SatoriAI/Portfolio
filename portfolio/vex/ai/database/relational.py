import re

from django.conf import settings
from django.db import models
from langchain_core.documents import Document

from university.models import Publication, School, Testimonial
from work.models import Experience, Project, Skill


def tokenize(question: str, locale: str) -> set[str]:  # pylint: disable=unused-argument
    """
    Simple tokenizer that splits by word boundaries and lowercases.
    Replaces the heavy Stanza NLP pipeline for performance.
    """
    return set(re.findall(r"\w+", (question or "").lower()))


class RelationalContextGetter:
    LEXICON_BY_LOCALE: dict[str, dict[type[models.Model], list[str]]] = {
        "en": {
            Skill: ["skill", "skills", "stack", "tech", "technologies", "technology"],
            Project: ["project", "projects", "portfolio", "repo", "repositories", "repository", "github"],
            Experience: [
                "experience",
                "work",
                "working",
                "worked",
                "employment",
                "career",
                "job",
                "jobs",
                "company",
                "companies",
            ],
            School: [
                "school",
                "schools",
                "university",
                "universities",
                "research",
                "study",
                "studies",
                "studied",
                "education",
                "advisor",
                "areas",
            ],
            Publication: [
                "publication",
                "publications",
                "paper",
                "papers",
                "journal",
                "journals",
                "article",
                "articles",
                "summary",
            ],
            Testimonial: [
                "testimonial",
                "testimonials",
                "course",
                "courses",
                "semester",
                "season",
                "opinion",
                "opinions",
                "review",
                "reviews",
            ],
        },
        "pl": {
            Skill: ["umiejętność", "umiejętności", "stack", "technologie", "tech", "technologia"],
            Project: [
                "projekt",
                "projekty",
                "projektach",
                "projektami",
                "projektów",
                "portfolio",
                "repozytorium",
                "repozytoria",
            ],
            Experience: [
                "doświadczenie",
                "doświadczenia",
                "praca",
                "pracy",
                "pracę",
                "pracuję",
                "pracowałem",
                "zatrudnienie",
                "kariera",
                "stanowisko",
                "firma",
                "firmy",
            ],
            School: [
                "szkoła",
                "szkoły",
                "uczelnia",
                "uczelnie",
                "uniwersytet",
                "uniwersytety",
                "badania",
                "studia",
                "studiowałem",
                "edukacja",
                "wykształcenie",
                "promotor",
                "obszary",
            ],
            Publication: [
                "publikacja",
                "publikacje",
                "publikacji",
                "artykuł",
                "artykuły",
                "czasopismo",
                "czasopisma",
                "periodyk",
                "streszczenie",
            ],
            Testimonial: [
                "referencja",
                "referencje",
                "opinia",
                "opinie",
                "kurs",
                "kursy",
                "semestr",
                "pora roku",
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
            qs = model.objects.all()  # type: ignore[attr-defined]
            if hasattr(model, "translations"):
                qs = qs.prefetch_related("translations")

            for obj in qs[: self._limit_per_model]:
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
