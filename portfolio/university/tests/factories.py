import random

import factory
import faker
from factory.django import DjangoModelFactory

from university.choices import Seasons
from university.models import Publication, School, Testimonial
from utils.factories import i18nMixin

fake = faker.Faker()

RESEARCH_AREAS = [
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Data Science",
    "Artificial Intelligence",
    "Software Engineering",
    "Distributed Systems",
    "Cybersecurity",
    "Human-Computer Interaction",
    "Algorithms",
    "Database Systems",
]

ACADEMIC_JOURNALS = [
    "Nature",
    "Science",
    "IEEE Transactions on Pattern Analysis and Machine Intelligence",
    "Journal of Machine Learning Research",
    "ACM Transactions on Information Systems",
    "Communications of the ACM",
    "Journal of Artificial Intelligence Research",
    "Neural Networks",
    "Information Processing & Management",
    "Expert Systems with Applications",
]


def _maybe_url(prob: float = 0.7) -> str | None:
    return fake.url() if random.random() < prob else None


def _maybe_advisor(prob: float = 0.8) -> str | None:
    return f"Prof. {fake.first_name()} {fake.last_name()}" if random.random() < prob else None


class SchoolFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = School
        skip_postgeneration_save = True

    # Shared fields
    start = factory.Faker("date_between", start_date="-10y", end_date="-2y")

    @factory.lazy_attribute
    def end(self):
        if random.random() < 0.3:  # ~30% ongoing studies; otherwise a date >= start
            return None
        return fake.date_between(start_date=self.start, end_date="today")

    # Translated fields (current language)
    study = factory.Faker(
        "random_element",
        elements=[
            "Computer Science PhD",
            "Computer Science MSc",
            "Data Science MSc",
            "Software Engineering BSc",
            "Artificial Intelligence PhD",
            "Information Technology BSc",
            "Applied Mathematics MSc",
        ],
    )
    university = factory.Faker(
        "random_element",
        elements=[
            "University of Warsaw",
            "Warsaw University of Technology",
            "AGH University of Science and Technology",
            "Jagiellonian University",
            "Wrocław University of Science and Technology",
            "Gdańsk University of Technology",
        ],
    )
    research = factory.Faker("paragraph")
    advisor = factory.LazyFunction(_maybe_advisor)
    areas = factory.LazyFunction(lambda: random.sample(RESEARCH_AREAS, k=random.randint(2, 4)))


class PublicationFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = Publication
        skip_postgeneration_save = True

    # Shared fields
    title = factory.Faker("sentence", nb_words=6)
    journal = factory.Faker("random_element", elements=ACADEMIC_JOURNALS)
    link = factory.LazyFunction(_maybe_url)
    year = factory.Faker("random_int", min=2015, max=2024)

    # Translated fields (current language)
    summary = factory.Faker("paragraph")


class TestimonialFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = Testimonial
        skip_postgeneration_save = True

    # Shared fields
    semester = factory.Faker(
        "random_element",
        elements=[
            "2020/2021",
            "2021/2022",
            "2022/2023",
            "2023/2024",
            "2024/2025",
        ],
    )
    season = factory.Faker("random_element", elements=[season.value for season in Seasons])

    # Translated fields (current language)
    course = factory.Faker(
        "random_element",
        elements=[
            "Advanced Machine Learning",
            "Data Structures and Algorithms",
            "Software Engineering",
            "Database Systems",
            "Computer Networks",
            "Artificial Intelligence",
            "Web Development",
            "Mobile Applications",
            "Cybersecurity Fundamentals",
            "Human-Computer Interaction",
        ],
    )
    content = factory.Faker("paragraph")


__all__ = [
    "SchoolFactory",
    "PublicationFactory",
    "TestimonialFactory",
]
