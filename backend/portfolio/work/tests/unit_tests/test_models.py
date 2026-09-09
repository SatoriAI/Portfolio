import faker
from ddt import data, ddt
from django.test import TestCase

from work.choices import Levels
from work.models import Experience, Project, Skill

fake = faker.Faker()


@ddt
class WorkModelsTestCase(TestCase):
    # -------------------------
    # Skill
    # -------------------------
    def test_create_skill_success(self) -> None:
        obj = Skill.objects.create(
            level=Levels.INTERMEDIATE,
            name="Python",
            description="General-purpose programming language.",
        )
        self.assertEqual(Skill.objects.count(), 1)
        self.assertEqual(obj.level, Levels.INTERMEDIATE)
        # choice label (UI, relies on gettext; default 'en')
        self.assertEqual(obj.get_level_display(), "3+ years of experience")
        # translated fields (current language)
        self.assertEqual(obj.name, "Python")
        self.assertEqual(obj.description, "General-purpose programming language.")
        self.assertIsNotNone(obj.representation_for("en"))

    @data(Levels.INTERMEDIATE, Levels.ADVANCED, Levels.EXPERT)
    def test_create_skill_with_various_levels(self, level: Levels) -> None:
        Skill.objects.create(level=level, name=fake.word(), description=fake.sentence())
        self.assertEqual(Skill.objects.count(), 1)
        self.assertEqual(Skill.objects.first().level, level)

    def test_skill_translations_roundtrip(self) -> None:
        obj = Skill.objects.create(level=Levels.EXPERT, name="Python", description="Expert level")
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
