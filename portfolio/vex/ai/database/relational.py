from django.conf import settings
from django.db import models
from langchain_core.documents import Document

from work.models import Experience, Project, Skill


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
                "firmy",
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
        for model, vocabulary in lexicon.items():
            if any(word in self.question for word in vocabulary):
                requirements.append(model)
        return requirements
