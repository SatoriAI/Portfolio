from django.db import models
from langchain_core.documents import Document

from work.models import Experience, Project, Skill


class RelationalContextGetter:
    LEXICON = {
        Skill: ["skill", "skills", "stack", "tech", "technologies"],
        Project: ["project", "projects", "portfolio", "repo", "repositories"],
        Experience: ["experience", "work", "employment", "career", "job", "jobs"],
    }

    def __init__(self, question: str, *, limit_per_model: int = 10) -> None:
        self.question = question.lower()
        self._limit_per_model = limit_per_model

    def get_context(self) -> list[Document]:
        documents = []

        for model in self._get_requirements():
            for obj in model.objects.all().limit(self._limit_per_model):  # type: ignore
                documents.append(Document(page_content=obj.representation))

        return documents

    def _get_requirements(self) -> list[type["models.Model"]]:
        requirements: list[type[models.Model]] = []
        for model, vocabulary in self.LEXICON.items():
            if any(word in self.question for word in vocabulary):
                requirements.append(model)
        return requirements
