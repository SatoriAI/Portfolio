import random

import factory
import faker
from factory.django import DjangoModelFactory

from utils.factories import i18nMixin
from work.models import Experience, Project, Skill

fake = faker.Faker()

TECH_STACK = [
    "Python",
    "Django",
    "DRF",
    "PostgreSQL",
    "Redis",
    "Docker",
    "Kubernetes",
    "Celery",
    "FastAPI",
    "AWS",
    "GCP",
]


def _maybe_url(prob: float = 0.7) -> str | None:
    return fake.url() if random.random() < prob else None


class SkillFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = Skill
        skip_postgeneration_save = True

    # Translated fields (current language)
    name = factory.Faker("word")
    description = factory.Faker("sentence", nb_words=8)


class ProjectFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = Project
        skip_postgeneration_save = True

    # Shared fields
    title = factory.Faker("sentence", nb_words=4)
    tags = factory.LazyFunction(lambda: fake.words(nb=random.randint(2, 5)))
    demo = factory.LazyFunction(_maybe_url)
    repository = factory.LazyFunction(_maybe_url)

    # Translated fields (current language)
    description = factory.Faker("paragraph")


class ExperienceFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = Experience
        skip_postgeneration_save = True

    # Shared fields
    position = factory.Faker("job")
    start = factory.Faker("date_between", start_date="-10y", end_date="-2y")
    company = factory.Faker("company")
    technologies = factory.LazyFunction(lambda: random.sample(TECH_STACK, k=random.randint(2, 5)))
    tools = factory.LazyFunction(lambda: random.sample(["Copilot", "Claude Code", "Cursor"], k=1))
    topics = None
    visible = True

    @factory.lazy_attribute
    def end(self):
        if random.random() < 0.5:  # ~50% open-ended; otherwise a date >= start
            return None
        return fake.date_between(start_date=self.start, end_date="today")

    # Translated fields (current language)
    role = factory.SelfAttribute("position")
    location = factory.Faker("city")
    product = factory.Faker("paragraph")
    responsibilities = factory.Faker("paragraph")
    contributions = factory.LazyFunction(lambda: [fake.sentence(nb_words=10) for _ in range(random.randint(1, 3))])
    results = factory.LazyFunction(lambda: [fake.sentence(nb_words=8) for _ in range(random.randint(1, 2))])
    description = factory.Faker("paragraph")
    achievements = factory.LazyFunction(lambda: [fake.sentence(nb_words=10) for _ in range(random.randint(1, 3))])


__all__ = [
    "SkillFactory",
    "ProjectFactory",
    "ExperienceFactory",
]
