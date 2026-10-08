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
            position="Python Developer", start="2022-09-01", company="Xperi", technologies=[]
        )
        for language, location in (("en", "Wroclaw"), ("pl", "Wrocław")):
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
