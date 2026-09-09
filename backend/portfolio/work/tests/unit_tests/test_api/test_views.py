from datetime import date

import faker
from django.test import TestCase
from django.urls import reverse

from work.choices import Levels
from work.tests.factories import ExperienceFactory, ProjectFactory, SkillFactory

fake = faker.Faker()


class SkillListViewTestCase(TestCase):
    def test_list_skills_empty(self) -> None:
        url = reverse("work:skills")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_skills_with_translations(self) -> None:
        obj = SkillFactory(
            level=Levels.EXPERT,
            name="Python",
            description="Expert-level Python programming",
            i18n={
                "pl": {
                    "name": "Python",
                    "description": "Programowanie w Pythonie na poziomie eksperckim",
                }
            },
        )

        url = reverse("work:skills")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        item = data[0]

        # Basic fields present
        self.assertEqual(item["id"], obj.id)
        self.assertEqual(item["level"], Levels.EXPERT)
        self.assertIn("created_at", item)
        self.assertIn("updated_at", item)

        # Translations dict contains both languages
        self.assertIn("translations", item)
        self.assertIn("en", item["translations"])
        self.assertIn("pl", item["translations"])
        self.assertEqual(item["translations"]["en"]["name"], "Python")
        self.assertEqual(item["translations"]["en"]["description"], "Expert-level Python programming")
        self.assertEqual(item["translations"]["pl"]["name"], "Python")
        self.assertEqual(
            item["translations"]["pl"]["description"],
            "Programowanie w Pythonie na poziomie eksperckim",
        )

    def test_list_skills_ordering_by_pk_asc(self) -> None:
        first = SkillFactory()
        second = SkillFactory()
        third = SkillFactory()

        url = reverse("work:skills")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 3)
        self.assertEqual([item["id"] for item in data], [first.id, second.id, third.id])


class ProjectListViewTestCase(TestCase):
    def test_list_projects_empty(self) -> None:
        url = reverse("work:projects")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_projects_with_translations(self) -> None:
        obj = ProjectFactory(
            title="API Service",
            tags=["django", "rest", "postgres"],
            demo="https://example.com/demo",
            repository="https://github.com/example/repo",
            description="HTTP API for clients",
            i18n={"pl": {"description": "Interfejs HTTP dla klientów"}},
        )

        url = reverse("work:projects")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        item = data[0]

        self.assertEqual(item["id"], obj.id)
        self.assertEqual(item["title"], "API Service")
        self.assertListEqual(item["tags"], ["django", "rest", "postgres"])
        self.assertEqual(item["demo"], "https://example.com/demo")
        self.assertEqual(item["repository"], "https://github.com/example/repo")

        self.assertIn("translations", item)
        self.assertEqual(item["translations"]["en"]["description"], "HTTP API for clients")
        self.assertEqual(item["translations"]["pl"]["description"], "Interfejs HTTP dla klientów")


class ExperienceListViewTestCase(TestCase):
    def test_list_experiences_empty(self) -> None:
        url = reverse("work:experiences")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_experiences_with_translations(self) -> None:
        obj = ExperienceFactory(
            position="Backend Developer",
            start=date(2023, 1, 10),
            end=date(2024, 2, 20),
            company="Acme Corp",
            technologies=["Python", "Django", "PostgreSQL"],
            location="Warsaw",
            description="Building backend services",
            achievements=["Introduced CI/CD", "Optimized SQL queries"],
            i18n={
                "pl": {
                    "location": "Warszawa",
                    "description": "Tworzenie usług backendowych",
                    "achievements": ["Wdrożenie CI/CD", "Optymalizacja zapytań SQL"],
                }
            },
        )

        url = reverse("work:experiences")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 1)
        item = data[0]

        # Shared fields
        self.assertEqual(item["id"], obj.id)
        self.assertEqual(item["position"], "Backend Developer")
        self.assertEqual(item["company"], "Acme Corp")
        self.assertEqual(item["start"], "2023-01-10")
        self.assertEqual(item["end"], "2024-02-20")
        self.assertListEqual(item["technologies"], ["Python", "Django", "PostgreSQL"])

        # Translated fields collected under translations
        self.assertIn("translations", item)
        self.assertIn("en", item["translations"])
        self.assertIn("pl", item["translations"])
        self.assertEqual(item["translations"]["en"]["location"], "Warsaw")
        self.assertEqual(item["translations"]["en"]["description"], "Building backend services")
        self.assertListEqual(item["translations"]["en"]["achievements"], ["Introduced CI/CD", "Optimized SQL queries"])
        self.assertEqual(item["translations"]["pl"]["location"], "Warszawa")
        self.assertEqual(item["translations"]["pl"]["description"], "Tworzenie usług backendowych")
        self.assertListEqual(
            item["translations"]["pl"]["achievements"],
            ["Wdrożenie CI/CD", "Optymalizacja zapytań SQL"],
        )

    def test_list_experiences_ordering_current_first_then_start_desc(self) -> None:
        # Current roles (end=None)
        current_newer = ExperienceFactory(position="Current Newer", start=date(2024, 6, 1), end=None)
        current_older = ExperienceFactory(position="Current Older", start=date(2023, 1, 1), end=None)

        # Ended roles (end set)
        ended_newer = ExperienceFactory(position="Ended Newer", start=date(2022, 5, 1), end=date(2023, 5, 1))
        ended_older = ExperienceFactory(position="Ended Older", start=date(2020, 3, 1), end=date(2021, 3, 1))

        url = reverse("work:experiences")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 4)
        # Current (end is null) first, ordered by start desc, then ended ordered by start desc
        self.assertEqual(
            [item["id"] for item in data],
            [current_newer.id, current_older.id, ended_newer.id, ended_older.id],
        )

    def test_list_experiences_ordering_with_multiple_current_and_ended(self) -> None:
        # Mix more items to ensure grouping and secondary ordering hold
        c3 = ExperienceFactory(position="Current 2025", start=date(2025, 1, 15), end=None)
        c1 = ExperienceFactory(position="Current 2022", start=date(2022, 7, 10), end=None)
        c2 = ExperienceFactory(position="Current 2023", start=date(2023, 8, 20), end=None)

        e2 = ExperienceFactory(position="Ended 2024 start", start=date(2024, 2, 1), end=date(2024, 12, 1))
        e1 = ExperienceFactory(position="Ended 2021 start", start=date(2021, 11, 1), end=date(2022, 2, 1))

        url = reverse("work:experiences")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        # Expect all currents by start desc, then all ended by start desc
        expected_order = [c3.id, c2.id, c1.id, e2.id, e1.id]
        self.assertEqual([item["id"] for item in data], expected_order)
