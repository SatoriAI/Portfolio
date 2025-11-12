from datetime import date

import faker
from django.test import TestCase
from django.urls import reverse

from university.choices import Seasons
from university.tests.factories import PublicationFactory, SchoolFactory, TestimonialFactory

fake = faker.Faker()


class SchoolListViewTestCase(TestCase):
    def test_list_schools_empty(self) -> None:
        url = reverse("university:schools")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_schools_with_translations(self) -> None:
        obj = SchoolFactory(
            start=date(2020, 9, 1),
            end=date(2024, 6, 30),
            study="Computer Science PhD",
            university="University of Warsaw",
            research="Research on deep learning applications in natural language processing",
            advisor="Prof. Anna Kowalski",
            areas=["Machine Learning", "Natural Language Processing", "Deep Learning"],
            i18n={
                "pl": {
                    "study": "Doktorat z Informatyki",
                    "university": "Uniwersytet Warszawski",
                    "research": "Badania nad zastosowaniami głębokiego uczenia w przetwarzaniu języka naturalnego",
                    "advisor": "Prof. Anna Kowalska",
                    "areas": ["Uczenie Maszynowe", "Przetwarzanie Języka Naturalnego", "Głębokie Uczenie"],
                }
            },
        )

        url = reverse("university:schools")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        item = data[0]

        # Basic fields present
        self.assertEqual(item["id"], obj.id)
        self.assertEqual(item["start"], "2020-09-01")
        self.assertEqual(item["end"], "2024-06-30")
        self.assertIn("created_at", item)
        self.assertIn("updated_at", item)

        # Translations dict contains both languages
        self.assertIn("translations", item)
        self.assertIn("en", item["translations"])
        self.assertIn("pl", item["translations"])
        self.assertEqual(item["translations"]["en"]["study"], "Computer Science PhD")
        self.assertEqual(item["translations"]["en"]["university"], "University of Warsaw")
        self.assertEqual(
            item["translations"]["en"]["research"],
            "Research on deep learning applications in natural language processing",
        )
        self.assertEqual(item["translations"]["en"]["advisor"], "Prof. Anna Kowalski")
        self.assertListEqual(
            item["translations"]["en"]["areas"],
            ["Machine Learning", "Natural Language Processing", "Deep Learning"],
        )
        self.assertEqual(item["translations"]["pl"]["study"], "Doktorat z Informatyki")
        self.assertEqual(item["translations"]["pl"]["university"], "Uniwersytet Warszawski")
        self.assertEqual(
            item["translations"]["pl"]["research"],
            "Badania nad zastosowaniami głębokiego uczenia w przetwarzaniu języka naturalnego",
        )
        self.assertEqual(item["translations"]["pl"]["advisor"], "Prof. Anna Kowalska")
        self.assertListEqual(
            item["translations"]["pl"]["areas"],
            ["Uczenie Maszynowe", "Przetwarzanie Języka Naturalnego", "Głębokie Uczenie"],
        )


class PublicationListViewTestCase(TestCase):
    def test_list_publications_empty(self) -> None:
        url = reverse("university:publications")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_publications_with_translations(self) -> None:
        obj = PublicationFactory(
            title="Deep Learning for Natural Language Processing: A Comprehensive Survey",
            journal="Journal of Machine Learning Research",
            link="https://example.com/publications/deep-learning-nlp",
            year=2023,
            summary="This paper provides a comprehensive survey of deep learning techniques.",
            i18n={"pl": {"summary": "Ten artykuł przedstawia kompleksowy przegląd technik głębokiego uczenia."}},
        )

        url = reverse("university:publications")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        item = data[0]

        self.assertEqual(item["id"], obj.id)
        self.assertEqual(item["journal"], "Journal of Machine Learning Research")
        self.assertEqual(item["link"], "https://example.com/publications/deep-learning-nlp")
        self.assertEqual(item["year"], 2023)

        self.assertIn("translations", item)
        self.assertEqual(
            item["translations"]["en"]["title"],
            "Deep Learning for Natural Language Processing: A Comprehensive Survey",
        )
        self.assertEqual(
            item["translations"]["en"]["summary"],
            "This paper provides a comprehensive survey of deep learning techniques.",
        )
        self.assertEqual(
            item["translations"]["pl"]["summary"],
            "Ten artykuł przedstawia kompleksowy przegląd technik głębokiego uczenia.",
        )

    def test_list_publications_ordering_by_year_desc(self) -> None:
        PublicationFactory(year=2020)
        PublicationFactory(year=2022)
        PublicationFactory(year=2021)

        url = reverse("university:publications")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 3)
        self.assertEqual([item["year"] for item in data], [2022, 2021, 2020])

    def test_list_publications_ordering_tiebreaker_pk_desc_when_same_year(self) -> None:
        first = PublicationFactory(year=2023)
        second = PublicationFactory(year=2023)

        url = reverse("university:publications")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual([item["id"] for item in data], [second.id, first.id])


class TestimonialListViewTestCase(TestCase):
    def test_list_testimonials_empty(self) -> None:
        url = reverse("university:testimonials")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_testimonials_with_translations(self) -> None:
        obj = TestimonialFactory(
            semester="2023/2024",
            season=Seasons.WINTER,
            course="Advanced Machine Learning",
            content="This course provided excellent theoretical foundation with modern ML algorithms.",
            i18n={
                "pl": {
                    "course": "Zaawansowane Uczenie Maszynowe",
                    "content": "Ten kurs zapewnił doskonałe podstawy teoretyczne doświadczenie z algorytmami ML.",
                }
            },
        )

        url = reverse("university:testimonials")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        item = data[0]

        # Shared fields
        self.assertEqual(item["id"], obj.id)
        self.assertEqual(item["semester"], "2023/2024")
        self.assertEqual(item["season"], Seasons.WINTER)
        self.assertIn("created_at", item)
        self.assertIn("updated_at", item)

        # Translated fields collected under translations
        self.assertIn("translations", item)
        self.assertIn("en", item["translations"])
        self.assertIn("pl", item["translations"])
        self.assertEqual(item["translations"]["en"]["course"], "Advanced Machine Learning")
        self.assertEqual(
            item["translations"]["en"]["content"],
            "This course provided excellent theoretical foundation with modern ML algorithms.",
        )
        self.assertEqual(item["translations"]["pl"]["course"], "Zaawansowane Uczenie Maszynowe")
        self.assertEqual(
            item["translations"]["pl"]["content"],
            "Ten kurs zapewnił doskonałe podstawy teoretyczne doświadczenie z algorytmami ML.",
        )
