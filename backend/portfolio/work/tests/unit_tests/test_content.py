import copy
import io
import json
import tempfile

from django.core.management import CommandError, call_command
from django.test import TestCase

from work.content import export, import_
from work.models import Experience, Skill, SkillCategory, TechnologyTerm


class WorkContentTestCase(TestCase):
    def setUp(self) -> None:
        self.skill = Skill.objects.create(name="Python", description="A language.", since=2016)
        self.skill.set_current_language("pl")
        self.skill.name = "Python"
        self.skill.save()
        self.role = Experience.objects.create(
            position="Python Developer",
            start="2022-09-01",
            company="Kelvinbrook",
            technologies=["Python"],
            location="Testowo",
        )

    def test_a_database_matches_its_own_export(self) -> None:
        report = import_(export(), apply=True)
        self.assertEqual(report.lines, [])

    def test_a_dry_run_reports_and_writes_nothing(self) -> None:
        data = export()
        skills = data["models"]["work.Skill"]
        skills[0]["fields"]["since"] = 2015
        skills[0]["translations"]["pl"]["name"] = "Python 3"
        report = import_(data, apply=False)
        self.assertEqual(len(report.changed), 1)
        self.assertIn("since: 2016 → 2015", report.changed[0])
        self.assertIn("name[pl]: 'Python' → 'Python 3'", report.changed[0])
        self.skill.refresh_from_db()
        self.assertEqual(self.skill.since, 2016)
        self.assertEqual(self.skill.safe_translation_getter("name", language_code="pl"), "Python")

    def test_apply_creates_and_changes_with_every_translation(self) -> None:
        data = export()
        new = copy.deepcopy(data["models"]["work.Skill"][0])
        new["pk"] = 50
        new["fields"].update(since=2025, since_launch=True)
        new["translations"] = {
            "en": {"name": "Claude Code", "description": None},
            "pl": {"name": "Claude Code", "description": None},
        }
        data["models"]["work.Skill"].append(new)
        data["models"]["work.Experience"][0]["fields"]["technologies"] = ["Python", "Microservices"]
        report = import_(data, apply=True)
        self.assertEqual(len(report.created), 1)
        self.assertEqual(len(report.changed), 1)
        created = Skill.objects.get(pk=50)
        self.assertTrue(created.since_launch)
        self.assertEqual(sorted(created.get_available_languages()), ["en", "pl"])
        self.role.refresh_from_db()
        self.assertListEqual(self.role.technologies, ["Python", "Microservices"])
        # The id sequence moved past the imported row, so the admin's next one does not collide.
        self.assertGreater(Skill.objects.create(name="Redis").pk, 50)

    def test_a_new_category_arrives_before_the_skill_placed_in_it(self) -> None:
        category = SkillCategory.objects.create(name="Languages and frameworks", order=0)
        category.set_current_language("pl")
        category.name = "Języki i frameworki"
        category.save()
        self.skill.category = category
        self.skill.order = 2
        self.skill.proven_by = ["Python", "Django"]
        self.skill.save()
        data = json.loads(json.dumps(export()))
        # Another database, which has neither the category nor the skill's place in it.
        SkillCategory.objects.all().delete()
        Skill.objects.filter(pk=self.skill.pk).update(order=0, proven_by=[])

        report = import_(data, apply=True)

        self.assertEqual(len(report.created), 1)
        imported = SkillCategory.objects.get()
        self.assertEqual(imported.pk, category.pk)
        self.assertEqual(imported.safe_translation_getter("name", language_code="pl"), "Języki i frameworki")
        self.skill.refresh_from_db()
        self.assertEqual(
            (self.skill.category_id, self.skill.order, self.skill.proven_by), (category.pk, 2, ["Python", "Django"])
        )
        self.assertEqual(import_(export(), apply=True).lines, [])

    def test_a_term_travels_with_its_id_and_labels_ahead_of_the_roles(self) -> None:
        term = TechnologyTerm.objects.create(name="Microservices", label="Microservices")
        term.set_current_language("pl")
        term.label = "Mikroserwisy"
        term.save()
        data = json.loads(json.dumps(export()))
        self.assertEqual(list(data["models"])[0], "work.TechnologyTerm")
        # Another database, which has not got the term.
        TechnologyTerm.objects.all().delete()

        report = import_(data, apply=True)

        self.assertEqual(len(report.created), 1)
        imported = TechnologyTerm.objects.get()
        self.assertEqual(imported.pk, term.pk)
        self.assertEqual(imported.safe_translation_getter("label", language_code="pl"), "Mikroserwisy")
        self.assertEqual(import_(export(), apply=True).lines, [])

    def test_a_row_the_data_lacks_is_reported_and_kept(self) -> None:
        data = export()
        data["models"]["work.Experience"] = []
        report = import_(data, apply=True)
        self.assertEqual(report.unmatched, [f"Experience {self.role.pk}"])
        self.assertTrue(Experience.objects.filter(pk=self.role.pk).exists())

    def test_a_term_spelled_differently_under_another_id_is_refused_by_name_and_nothing_written(self) -> None:
        term = TechnologyTerm.objects.create(name="Microservices", label="Microservices")
        data = json.loads(json.dumps(export()))
        data["models"]["work.Experience"][0]["fields"]["company"] = "Globex"
        # Another database, where the same term was added on its own under another id.
        term.delete()
        other = TechnologyTerm.objects.create(name="microservices", label="Microservices")

        with self.assertRaisesMessage(ValueError, f"'Microservices' already exists under pk {other.pk}"):
            import_(data, apply=True)

        self.assertListEqual(list(TechnologyTerm.objects.values_list("pk", flat=True)), [other.pk])
        self.role.refresh_from_db()
        self.assertEqual(self.role.company, "Kelvinbrook")
        with tempfile.NamedTemporaryFile("w+", suffix=".json") as file:
            json.dump(data, file)
            file.flush()
            with self.assertRaisesMessage(CommandError, f"already exists under pk {other.pk}"):
                call_command("import_work", file.name, stdout=io.StringIO())

    def test_an_unknown_format_is_refused(self) -> None:
        with self.assertRaises(ValueError):
            import_({"format": 99, "models": {}}, apply=True)

    def test_the_commands_round_trip_through_json(self) -> None:
        out = io.StringIO()
        call_command("export_work", stdout=out)
        result = io.StringIO()
        with tempfile.NamedTemporaryFile("w+", suffix=".json") as file:
            file.write(out.getvalue())
            file.flush()
            call_command("import_work", file.name, stdout=result)
        self.assertIn("Would apply (dry run, nothing written): 0 created, 0 changed", result.getvalue())
        self.assertEqual(json.loads(out.getvalue())["format"], 1)
