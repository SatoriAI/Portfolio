from datetime import date

import faker
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from work.tests.factories import (
    ExperienceFactory,
    ProjectFactory,
    SkillCategoryFactory,
    SkillFactory,
    TechnologyTermFactory,
)

fake = faker.Faker()


class SkillListViewTestCase(TestCase):
    def test_list_skills_empty(self) -> None:
        url = reverse("work:skills")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_skills_with_translations(self) -> None:
        obj = SkillFactory(
            since=2016,
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
        self.assertEqual(item["since"], 2016)
        self.assertFalse(item["since_launch"])
        self.assertNotIn("level", item)
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

    def test_a_skill_carries_its_category_with_both_names_and_its_evidence(self) -> None:
        category = SkillCategoryFactory(name="Languages", order=2, i18n={"pl": {"name": "Języki"}})
        obj = SkillFactory(category=category, order=1, icon="Python", proven_by=["Python", "FastAPI"])

        item = self.client.get(reverse("work:skills")).json()[0]

        self.assertEqual(item["id"], obj.id)
        self.assertDictEqual(
            item["category"],
            {"id": category.id, "order": 2, "translations": {"en": {"name": "Languages"}, "pl": {"name": "Języki"}}},
        )
        self.assertEqual(item["order"], 1)
        self.assertEqual(item["icon"], "Python")
        self.assertListEqual(item["proven_by"], ["Python", "FastAPI"])

    def test_a_skill_keeps_every_field_the_current_site_reads(self) -> None:
        SkillFactory(since=2016)
        item = self.client.get(reverse("work:skills")).json()[0]
        self.assertTrue(
            {"id", "icon", "since", "since_launch", "translations", "created_at", "updated_at"} <= item.keys()
        )
        self.assertIsInstance(item["id"], int)
        self.assertIsInstance(item["icon"], str)
        self.assertIsNone(item["category"])
        self.assertEqual(item["order"], 0)
        self.assertListEqual(item["proven_by"], [])

    def test_skills_come_by_category_then_their_place_with_the_uncategorised_last(self) -> None:
        second = SkillCategoryFactory(order=1)
        first = SkillCategoryFactory(order=0)
        loose = SkillFactory()
        b2 = SkillFactory(category=second, order=1)
        a1 = SkillFactory(category=first, order=1)
        b1 = SkillFactory(category=second, order=0)
        a0 = SkillFactory(category=first, order=0)

        with self.assertNumQueries(3):
            data = self.client.get(reverse("work:skills")).json()

        self.assertEqual([item["id"] for item in data], [a0.id, a1.id, b1.id, b2.id, loose.id])

    def test_two_categories_with_one_order_do_not_interleave(self) -> None:
        older = SkillCategoryFactory(order=0)
        newer = SkillCategoryFactory(order=0)
        n0 = SkillFactory(category=newer, order=0)
        o1 = SkillFactory(category=older, order=1)
        o0 = SkillFactory(category=older, order=0)
        data = self.client.get(reverse("work:skills")).json()
        self.assertEqual([item["id"] for item in data], [o0.id, o1.id, n0.id])


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
            vex_question="How does the API handle auth?",
            i18n={"pl": {"description": "Interfejs HTTP dla klientów", "vex_question": "Jak API obsługuje logowanie?"}},
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
        self.assertFalse(item["mobile"])

        self.assertIn("translations", item)
        self.assertEqual(item["translations"]["en"]["description"], "HTTP API for clients")
        self.assertEqual(item["translations"]["pl"]["description"], "Interfejs HTTP dla klientów")
        self.assertEqual(item["translations"]["en"]["vex_question"], "How does the API handle auth?")
        self.assertEqual(item["translations"]["pl"]["vex_question"], "Jak API obsługuje logowanie?")

    def test_a_phone_app_says_so(self) -> None:
        ProjectFactory(mobile=True)
        self.assertTrue(self.client.get(reverse("work:projects")).json()[0]["mobile"])

    def test_vex_question_is_empty_until_written(self) -> None:
        ProjectFactory()
        item = self.client.get(reverse("work:projects")).json()[0]
        self.assertEqual(item["translations"]["en"]["vex_question"], "")


class TermsDisplayTestCase(TestCase):
    """Roles and projects give their lists in each language, beside the lists as written."""

    def setUp(self) -> None:
        TechnologyTermFactory(name="Microservices", label="Microservices", i18n={"pl": {"label": "Mikroserwisy"}})

    def test_a_role_gives_its_technologies_in_each_language_and_as_written(self) -> None:
        ExperienceFactory(technologies=["Python", "microservices"], tools=["Microservices"])
        item = self.client.get(reverse("work:experiences")).json()[0]
        self.assertListEqual(item["technologies"], ["Python", "microservices"])
        self.assertDictEqual(
            item["technologies_display"], {"en": ["Python", "Microservices"], "pl": ["Python", "Mikroserwisy"]}
        )
        # Tools are product names, given only as written.
        self.assertListEqual(item["tools"], ["Microservices"])
        self.assertNotIn("tools_display", item)

    def test_a_project_gives_its_tags_in_each_language_and_as_written(self) -> None:
        ProjectFactory(tags=["Go", "Microservices"])
        item = self.client.get(reverse("work:projects")).json()[0]
        self.assertListEqual(item["tags"], ["Go", "Microservices"])
        self.assertDictEqual(item["tags_display"], {"en": ["Go", "Microservices"], "pl": ["Go", "Mikroserwisy"]})

    def test_a_role_without_technologies_keeps_null_and_shows_empty_lists(self) -> None:
        ExperienceFactory(technologies=None)
        item = self.client.get(reverse("work:experiences")).json()[0]
        self.assertIsNone(item["technologies"])
        self.assertDictEqual(item["technologies_display"], {"en": [], "pl": []})

    def test_the_terms_are_read_once_however_many_rows_are_listed(self) -> None:
        for name, factory in (("experiences", ExperienceFactory), ("projects", ProjectFactory)):
            with self.subTest(name):
                factory()
                with CaptureQueriesContext(connection) as few:
                    self.client.get(reverse(f"work:{name}"))
                factory.create_batch(4)
                TechnologyTermFactory.create_batch(3)
                with CaptureQueriesContext(connection) as more:
                    data = self.client.get(reverse(f"work:{name}")).json()
                self.assertEqual(len(data), 5)
                self.assertEqual(len(more), len(few))


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

    def test_list_experiences_with_structured_fields(self) -> None:
        obj = ExperienceFactory(
            position="Python Backend Engineer",
            company="Acme Corp",
            tools=["Claude Code"],
            topics=["Databases", "Testing"],
            role="Python Backend Engineer",
            product="A platform for grant applications",
            responsibilities="Backend and data model",
            contributions=["Designed the API", "Wrote the importer"],
            results=["Applications filed in half the time"],
            vex_question="What did the importer do?",
            i18n={
                "pl": {
                    "role": "Inżynier backendu Python",
                    "location": "Online",
                    "product": "Serwis do wniosków grantowych",
                    "responsibilities": "Backend i model danych",
                    "contributions": ["Projekt API", "Importer danych"],
                    "results": ["Wnioski składane w połowę czasu"],
                    "vex_question": "Co robił importer?",
                }
            },
        )

        response = self.client.get(reverse("work:experiences"))
        self.assertEqual(response.status_code, 200)
        item = response.json()[0]

        self.assertEqual(item["id"], obj.id)
        # Only visible roles are listed, so the flag stays internal.
        self.assertNotIn("visible", item)
        self.assertListEqual(item["tools"], ["Claude Code"])
        self.assertListEqual(item["topics"], ["Databases", "Testing"])
        en, pl = item["translations"]["en"], item["translations"]["pl"]
        self.assertEqual(en["role"], "Python Backend Engineer")
        self.assertEqual(en["product"], "A platform for grant applications")
        self.assertEqual(en["responsibilities"], "Backend and data model")
        self.assertListEqual(en["contributions"], ["Designed the API", "Wrote the importer"])
        self.assertListEqual(en["results"], ["Applications filed in half the time"])
        self.assertEqual(pl["role"], "Inżynier backendu Python")
        self.assertEqual(pl["product"], "Serwis do wniosków grantowych")
        self.assertListEqual(pl["contributions"], ["Projekt API", "Importer danych"])
        self.assertListEqual(pl["results"], ["Wnioski składane w połowę czasu"])
        self.assertEqual(en["vex_question"], "What did the importer do?")
        self.assertEqual(pl["vex_question"], "Co robił importer?")

    def test_vex_question_is_empty_until_written(self) -> None:
        ExperienceFactory()
        item = self.client.get(reverse("work:experiences")).json()[0]
        self.assertEqual(item["translations"]["en"]["vex_question"], "")

    def test_list_experiences_leaves_out_hidden_roles(self) -> None:
        shown = ExperienceFactory(company="Shown Corp")
        ExperienceFactory(company="Hidden Corp", visible=False)

        response = self.client.get(reverse("work:experiences"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [shown.id])

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
