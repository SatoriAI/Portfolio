from typing import Any

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

BEFORE = [("work", "0007_alter_skill_level")]
AFTER = [("work", "0008_experience_structured_fields")]


class CopyPositionToRoleTestCase(TransactionTestCase):
    """0008 starts each translation's role from its role's current position."""

    def setUp(self) -> None:
        executor = MigrationExecutor(connection)
        executor.migrate(BEFORE)
        # Back to the latest schema whatever happens next, so later tests never see 0007.
        self.addCleanup(
            lambda: MigrationExecutor(connection).migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())
        )
        apps = executor.loader.project_state(BEFORE).apps
        Experience = apps.get_model("work", "Experience")
        ExperienceTranslation = apps.get_model("work", "ExperienceTranslation")
        experience = Experience.objects.create(
            position="Python Developer", start="2022-09-01", company="Kelvinbrook", technologies=[]
        )
        for language, location in (("en", "Testtown"), ("pl", "Testowo")):
            ExperienceTranslation.objects.create(master=experience, language_code=language, location=location)
        self.pk = experience.pk

    def test_role_is_copied_from_position_in_every_language(self) -> None:
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(AFTER)
        apps = executor.loader.project_state(AFTER).apps
        ExperienceTranslation = apps.get_model("work", "ExperienceTranslation")
        roles = dict(ExperienceTranslation.objects.filter(master_id=self.pk).values_list("language_code", "role"))
        self.assertDictEqual(roles, {"en": "Python Developer", "pl": "Python Developer"})


class CarryLevelsOverTestCase(TransactionTestCase):
    """0009 keeps what the old levels said that the roles cannot show."""

    BEFORE = [("work", "0008_experience_structured_fields")]
    AFTER = [("work", "0009_skill_since")]

    def setUp(self) -> None:
        executor = MigrationExecutor(connection)
        executor.migrate(self.BEFORE)
        self.addCleanup(
            lambda: MigrationExecutor(connection).migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())
        )
        Skill = executor.loader.project_state(self.BEFORE).apps.get_model("work", "Skill")
        self.pks = {
            level: Skill.objects.create(level=level).pk
            for level in ("3+ years of experience", "5+ years of experience", "10+ years of experience", "Since launch")
        }

    def test_ten_years_becomes_2016_and_since_launch_its_flag_and_year(self) -> None:
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(self.AFTER)
        Skill = executor.loader.project_state(self.AFTER).apps.get_model("work", "Skill")
        found = {
            level: tuple(Skill.objects.filter(pk=pk).values_list("since", "since_launch").get())
            for level, pk in self.pks.items()
        }
        self.assertDictEqual(
            found,
            {
                "3+ years of experience": (None, False),
                "5+ years of experience": (None, False),
                "10+ years of experience": (2016, False),
                "Since launch": (2025, True),
            },
        )


class MarkPhoneAppsTestCase(TransactionTestCase):
    """0012 marks Slip as a phone app and leaves every other project as it is."""

    BEFORE = [("work", "0011_project_mobile")]
    AFTER = [("work", "0012_mark_slip_mobile")]

    def setUp(self) -> None:
        executor = MigrationExecutor(connection)
        executor.migrate(self.BEFORE)
        self.addCleanup(
            lambda: MigrationExecutor(connection).migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())
        )
        Project = executor.loader.project_state(self.BEFORE).apps.get_model("work", "Project")
        self.pks = {title: Project.objects.create(title=title).pk for title in ("Slip", "Tidebell")}

    def test_slip_is_marked_and_the_rest_are_not(self) -> None:
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(self.AFTER)
        Project = executor.loader.project_state(self.AFTER).apps.get_model("work", "Project")
        marked = dict(Project.objects.filter(pk__in=self.pks.values()).values_list("title", "mobile"))
        self.assertDictEqual(marked, {"Slip": True, "Tidebell": False})


class FillSkillCategoriesTestCase(TransactionTestCase):
    """0014 moves the groups, evidence and icons the frontend kept in code into the skills, by id."""

    BEFORE = [("work", "0013_skill_category")]
    AFTER = [("work", "0014_fill_skill_categories")]

    def setUp(self) -> None:
        executor = MigrationExecutor(connection)
        executor.migrate(self.BEFORE)
        self.addCleanup(
            lambda: MigrationExecutor(connection).migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())
        )
        self.Skill = executor.loader.project_state(self.BEFORE).apps.get_model("work", "Skill")

    def _migrate(self) -> Any:
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(self.AFTER)
        return executor.loader.project_state(self.AFTER).apps

    def test_a_database_without_skills_gets_no_categories(self) -> None:
        apps = self._migrate()
        self.assertFalse(apps.get_model("work", "SkillCategory").objects.exists())

    def test_each_skill_lands_in_its_group_in_order_with_its_evidence_and_icon(self) -> None:
        for pk in (*range(1, 14), 40):
            self.Skill.objects.create(pk=pk)
        apps = self._migrate()
        translations = apps.get_model("work", "SkillCategoryTranslation").objects
        names = {
            f"{order}:{language}": name
            for order, language, name in translations.values_list("master__order", "language_code", "name")
        }
        self.assertDictEqual(
            names,
            {
                "0:en": "Languages and frameworks",
                "0:pl": "Języki i frameworki",
                "1:en": "Databases and architecture",
                "1:pl": "Bazy danych i architektura",
                "2:en": "Infrastructure and deployment",
                "2:pl": "Infrastruktura i wdrażanie",
                "3:en": "AI and tools",
                "3:pl": "AI i narzędzia",
            },
        )
        Skill = apps.get_model("work", "Skill")
        placed = {
            pk: (group, place)
            for pk, group, place in Skill.objects.exclude(category=None).values_list("pk", "category__order", "order")
        }
        # fmt: off
        self.assertDictEqual(
            placed,
            {
                9: (0, 0), 1: (0, 1), 13: (0, 2),
                2: (1, 0), 12: (1, 1), 4: (1, 2),
                3: (2, 0), 6: (2, 1), 8: (2, 2), 7: (2, 3),
                5: (3, 0), 10: (3, 1), 11: (3, 2),
            },
        )
        # fmt: on
        shown = {pk: (icon, proven_by) for pk, icon, proven_by in Skill.objects.values_list("pk", "icon", "proven_by")}
        self.assertEqual(shown[1], ("Python", ["Python", "FastAPI", "Django"]))
        self.assertEqual(shown[7], ("Infinity", ["CI", "CI/CD"]))
        self.assertEqual(shown[13], ("Go", ["Go"]))
        # A skill the frontend never knew is left as it was.
        self.assertEqual(shown[40], ("Code", []))
        self.assertIsNone(Skill.objects.get(pk=40).category_id)

    def test_running_it_again_after_going_back_changes_nothing(self) -> None:
        for pk in range(1, 14):
            self.Skill.objects.create(pk=pk)
        Skill = self._migrate().get_model("work", "Skill")
        # An edit made in the admin between the two runs.
        Skill.objects.filter(pk=13).update(icon="Code", proven_by=["Go", "Golang"], order=5)
        before = list(Skill.objects.order_by("pk").values_list("pk", "category_id", "order", "icon", "proven_by"))
        MigrationExecutor(connection).migrate(self.BEFORE)

        apps = self._migrate()

        self.assertEqual(apps.get_model("work", "SkillCategory").objects.count(), 4)
        Skill = apps.get_model("work", "Skill")
        after = list(Skill.objects.order_by("pk").values_list("pk", "category_id", "order", "icon", "proven_by"))
        self.assertListEqual(after, before)

    def test_an_id_the_database_lacks_is_skipped(self) -> None:
        self.Skill.objects.create(pk=9)
        apps = self._migrate()
        self.assertEqual(apps.get_model("work", "SkillCategory").objects.count(), 4)
        self.assertEqual(apps.get_model("work", "Skill").objects.get().icon, "React")
