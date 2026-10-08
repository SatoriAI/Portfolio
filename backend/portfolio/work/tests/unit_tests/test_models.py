import faker
from ddt import data, ddt
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from work.models import Experience, Project, Skill

fake = faker.Faker()


@ddt
class WorkModelsTestCase(TestCase):
    # -------------------------
    # Skill
    # -------------------------
    def test_create_skill_success(self) -> None:
        obj = Skill.objects.create(
            name="Python",
            description="General-purpose programming language.",
        )
        self.assertEqual(Skill.objects.count(), 1)
        # Counted from the roles unless told otherwise.
        self.assertIsNone(obj.since)
        self.assertFalse(obj.since_launch)
        # translated fields (current language)
        self.assertEqual(obj.name, "Python")
        self.assertEqual(obj.description, "General-purpose programming language.")
        self.assertIsNotNone(obj.representation_for("en"))

    def test_skill_cannot_have_a_year_and_be_since_launch(self) -> None:
        with self.assertRaises(IntegrityError):
            Skill.objects.create(since=2016, since_launch=True, name="Python")

    def test_skill_form_says_a_year_and_since_launch_clash(self) -> None:
        skill = Skill(since=2016, since_launch=True, name="Python")
        with self.assertRaisesMessage(ValidationError, "not both"):
            skill.full_clean()

    @data(1989, timezone.now().year + 1)
    def test_skill_year_is_neither_ancient_nor_future(self, year: int) -> None:
        with self.assertRaises(ValidationError) as caught:
            Skill(since=year, name="Python").full_clean()
        self.assertIn("since", caught.exception.message_dict)

    @data(
        ({"since": 2016}, "Used since: 2016, before the roles that show it"),
        ({"since_launch": True}, "Used since: its launch"),
        ({}, None),
    )
    def test_skill_representation_tells_vex_what_the_roles_cannot(self, case: tuple[dict, str | None]) -> None:
        fields, line = case
        text = Skill.objects.create(name="Python", description="Backends", **fields).representation_for("en")
        if line is None:
            self.assertNotIn("Used since", text)
        else:
            self.assertIn(line, text)
        self.assertIn("Skill: Python", text)
        self.assertIn("Description: Backends", text)

    def test_skill_translations_roundtrip(self) -> None:
        obj = Skill.objects.create(since=2016, name="Python", description="Expert level")
        # add Polish translation
        obj.set_current_language("pl")
        obj.name = "Python"
        obj.description = "Poziom ekspercki"
        obj.save()

        # fetch in PL
        pl = Skill.objects.language("pl").get(pk=obj.pk)
        self.assertEqual(pl.name, "Python")
        self.assertEqual(pl.description, "Poziom ekspercki")

        # fetch in EN
        en = Skill.objects.language("en").get(pk=obj.pk)
        self.assertEqual(en.name, "Python")
        self.assertEqual(en.description, "Expert level")

    # -------------------------
    # Project
    # -------------------------
    def test_create_project_success(self) -> None:
        tags = ["django", "rest", "postgres"]
        obj = Project.objects.create(
            title="API Service",
            tags=tags,
            demo="https://example.com/demo",
            repository="https://github.com/example/repo",
            description="HTTP API for clients",
        )
        self.assertEqual(Project.objects.count(), 1)
        self.assertEqual(obj.title, "API Service")
        self.assertListEqual(obj.tags, tags)
        self.assertEqual(obj.demo, "https://example.com/demo")
        self.assertEqual(obj.repository, "https://github.com/example/repo")
        self.assertEqual(obj.description, "HTTP API for clients")
        self.assertIsNotNone(obj.representation_for("en"))

    def test_project_tags_optional(self) -> None:
        obj = Project.objects.create(
            title="Minimal Project",
            tags=None,
            demo=None,
            repository=None,
            description="Bare-bones project",
        )
        self.assertEqual(Project.objects.count(), 1)
        self.assertIsNone(obj.tags)
        self.assertIsNone(obj.demo)
        self.assertIsNone(obj.repository)

    def test_project_translation_description(self) -> None:
        obj = Project.objects.create(
            title="Landing Page",
            tags=["frontend"],
            demo="https://example.com",
            repository="https://github.com/example/landing",
            description="Marketing site",
        )
        # add PL translation
        obj.set_current_language("pl")
        obj.description = "Strona marketingowa"
        obj.save()

        pl = Project.objects.language("pl").get(pk=obj.pk)
        self.assertEqual(pl.description, "Strona marketingowa")

        en = Project.objects.language("en").get(pk=obj.pk)
        self.assertEqual(en.description, "Marketing site")

    # -------------------------
    # Experience
    # -------------------------
    def test_create_experience_success(self) -> None:
        start = fake.date_object()
        end = fake.date_between(start_date=start, end_date="+2y")
        tech = ["Python", "Django", "PostgreSQL"]

        obj = Experience.objects.create(
            position="Backend Developer",
            start=start,
            end=end,
            company="Acme Corp",
            technologies=tech,
            location="Warsaw",
            description="Building backend services",
            achievements=["Introduced CI/CD", "Optimized SQL queries"],
        )

        self.assertEqual(Experience.objects.count(), 1)
        self.assertEqual(obj.position, "Backend Developer")
        self.assertEqual(obj.company, "Acme Corp")
        self.assertListEqual(obj.technologies, tech)
        self.assertEqual(obj.location, "Warsaw")
        self.assertEqual(obj.description, "Building backend services")
        self.assertListEqual(obj.achievements, ["Introduced CI/CD", "Optimized SQL queries"])
        # period property matches implementation
        self.assertEqual(obj.period, f"{start.year} - {end.year}")
        self.assertIsNotNone(obj.representation_for("en"))

    def test_experience_open_ended_period(self) -> None:
        start = fake.date_object()
        obj = Experience.objects.create(
            position="Engineer",
            start=start,
            end=None,
            company="Globex",
            technologies=None,
            location="Kraków",
            description="R&D projects",
            achievements=None,
        )
        self.assertEqual(Experience.objects.count(), 1)
        # trailing space after hyphen is expected by current implementation
        self.assertEqual(obj.period, f"{start.year} - ")

    def test_experience_is_visible_by_default_and_can_be_hidden(self) -> None:
        shown = Experience.objects.create(
            position="Engineer", start=fake.date_object(), company="Acme", location="Online"
        )
        hidden = Experience.objects.create(
            position="Engineer", start=fake.date_object(), company="Globex", location="Online", visible=False
        )
        self.assertTrue(shown.visible)
        self.assertListEqual(list(Experience.objects.visible()), [shown])
        self.assertIn(hidden, Experience.objects.all())

    def test_experience_representation_uses_the_structured_fields(self) -> None:
        obj = Experience.objects.create(
            position="Engineer",
            start=fake.date_object(),
            company="Acme",
            location="Online",
            role="Python Backend Engineer",
            tools=["Claude Code"],
            product="A grant platform",
            contributions=["Designed the API"],
            results=["Half the filing time"],
        )
        text = obj.representation_for("en")
        self.assertIn("Experience: Python Backend Engineer at Acme", text)
        self.assertIn("Tools: Claude Code", text)
        self.assertIn("Product: A grant platform", text)
        self.assertIn("Contributions: Designed the API", text)
        self.assertIn("Results: Half the filing time", text)
        # Fields the role does not have are left out rather than given empty.
        self.assertNotIn("Topics:", text)
        self.assertNotIn("Responsibilities:", text)

    def test_experience_representation_gives_the_old_write_up_only_where_the_new_is_empty(self) -> None:
        old_only = Experience.objects.create(
            position="Engineer",
            start=fake.date_object(),
            company="Acme",
            location="Online",
            description="Old paragraph",
            achievements=["Old bullet"],
        )
        text = old_only.representation_for("en")
        self.assertIn("Description: Old paragraph", text)
        self.assertIn("Achievements: Old bullet", text)

        rewritten = Experience.objects.create(
            position="Engineer",
            start=fake.date_object(),
            company="Globex",
            location="Online",
            responsibilities="New paragraph",
            results=["New result"],
            description="Old paragraph",
            achievements=["Old bullet"],
        )
        text = rewritten.representation_for("en")
        self.assertIn("Responsibilities: New paragraph", text)
        self.assertIn("Results: New result", text)
        self.assertNotIn("Old paragraph", text)
        self.assertNotIn("Old bullet", text)

    def test_experience_representation_falls_back_to_position(self) -> None:
        obj = Experience.objects.create(
            position="Engineer", start=fake.date_object(), company="Acme", location="Online"
        )
        self.assertIn("Experience: Engineer at Acme", obj.representation_for("en"))

    def test_experience_translations(self) -> None:
        obj = Experience.objects.create(
            position="Engineer",
            start=fake.date_object(),
            end=None,
            company="Initrode",
            technologies=["Docker", "Kubernetes"],
            location="Berlin",
            description="Platform engineering",
            achievements=["Migrated to k8s"],
        )
        # Add PL translation of translated fields
        obj.set_current_language("pl")
        obj.location = "Berlin"
        obj.description = "Inżynieria platformy"
        obj.achievements = ["Migracja do k8s"]
        obj.save()

        pl = Experience.objects.language("pl").get(pk=obj.pk)
        self.assertEqual(pl.location, "Berlin")
        self.assertEqual(pl.description, "Inżynieria platformy")
        self.assertListEqual(pl.achievements, ["Migracja do k8s"])

        en = Experience.objects.language("en").get(pk=obj.pk)
        self.assertEqual(en.location, "Berlin")
        self.assertEqual(en.description, "Platform engineering")
        self.assertListEqual(en.achievements, ["Migrated to k8s"])
