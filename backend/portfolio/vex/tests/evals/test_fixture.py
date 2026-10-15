"""The evals' knowledge and prompt (fixture.py, owner.py, conftest.py): about the invented owner alone, read as
production reads it. Part of the default run: it calls no model."""

from unittest.mock import patch

from django.test import TestCase

from vex.ai import knowledge
from vex.ai.knowledge import build
from vex.ai.prompt import system_prompt
from vex.tests.evals import fixture, owner
from vex.utils.cache import cache


class EvalKnowledgeTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        fixture.load()

    def setUp(self) -> None:
        cache.clear()
        knowledge.clear_cache()
        self.addCleanup(knowledge.clear_cache)
        patcher = patch("vex.ai.knowledge.site_sources", fixture.site_sources)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_every_part_of_the_knowledge_is_there_in_both_languages(self) -> None:
        for locale, role in (("en", "Thermal Simulation Engineer"), ("pl", "Inżynier symulacji termicznych")):
            with self.subTest(locale=locale):
                base = build(locale)
                self.assertEqual({source.kind for source in base.sources}, {"document", "site", "database"})
                self.assertIn(role, base.text)
                self.assertIn(
                    f"What students say about {owner.FIRST_NAME}'s teaching", [source.title for source in base.sources]
                )

    def test_a_hidden_role_stays_out_as_in_production(self) -> None:
        self.assertNotIn("Moonquay", build("en").text)

    def test_the_prompt_speaks_for_the_invented_owner_alone(self) -> None:
        # The package's conftest puts him in the settings; every mention of Dawid, in the rules, the persona or the
        # knowledge, would be a fact about someone the evals' knowledge does not hold. Lowercase, so the check also
        # covers his production contact address.
        for locale in ("en", "pl"):
            with self.subTest(locale=locale):
                prompt = system_prompt(locale)
                self.assertIn(f"{owner.NAME}'s portfolio website", prompt)
                self.assertIn(f"[{owner.EMAIL}](mailto:{owner.EMAIL})", prompt)
                self.assertIn("<persona>", prompt)
                for name in ("dawid", "hanrahan"):
                    self.assertNotIn(name, prompt.lower())
