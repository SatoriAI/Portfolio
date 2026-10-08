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
