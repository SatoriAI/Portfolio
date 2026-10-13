from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings

from vex.ai import knowledge
from vex.ai.history import Turn
from vex.ai.prompt import build_messages, persona, system_prompt
from vex.tests.factories import ConfigurationFactory, DocumentFactory


@override_settings(VEX_SITE_CONTENT_URL="", VEX_CONTACT_EMAIL="dawid@example.com")
class PromptTestCase(TestCase):
    def setUp(self) -> None:
        cache.clear()
        knowledge.clear_cache()
        self.addCleanup(knowledge.clear_cache)

    def test_rules_then_persona_then_knowledge(self) -> None:
        ConfigurationFactory(i18n={"en": {"system_prompt": "Be breezy."}, "pl": {"system_prompt": "Bądź luzacki."}})
        DocumentFactory(title="Favourites", language="pl", description="", url=None, content="Spaghetti.")
        prompt = system_prompt("pl")
        rules = prompt.index("You are Vex")
        notes = prompt.index("<persona>\nBądź luzacki.\n</persona>")
        known = prompt.index('<knowledge>\n<source title="Favourites">\nSpaghetti.\n</source>\n</knowledge>')
        self.assertLess(rules, notes)
        self.assertLess(notes, known)
        self.assertTrue(prompt.endswith("</knowledge>"))

    def test_the_rules_name_the_contact_address_and_the_sites_language(self) -> None:
        polish, english = system_prompt("pl"), system_prompt("en")
        self.assertIn("[dawid@example.com](mailto:dawid@example.com)", polish)
        self.assertIn("reply in Polish", polish)
        self.assertIn("reply in English", english)

    def test_no_configuration_means_no_persona(self) -> None:
        self.assertEqual(persona("en"), "")
        self.assertNotIn("<persona>", system_prompt("en"))

    def test_a_persona_missing_in_one_language_falls_back_to_another(self) -> None:
        ConfigurationFactory(i18n={"en": {"system_prompt": " Be breezy. "}})
        self.assertEqual(persona("pl"), "Be breezy.")

    def test_the_persona_is_read_once_a_minute_not_per_question(self) -> None:
        configuration = ConfigurationFactory(i18n={"en": {"system_prompt": "Old."}})
        self.assertEqual(persona("en"), "Old.")
        configuration.set_current_language("en")
        configuration.system_prompt = "New."
        configuration.save()
        self.assertEqual(persona("en"), "Old.")
        cache.clear()
        self.assertEqual(persona("en"), "New.")

    def test_messages_are_the_system_prompt_the_history_and_the_question(self) -> None:
        with patch("vex.ai.prompt.system_prompt", return_value="S"):
            messages = build_messages("Q2", "en", [Turn("user", "Q1"), Turn("assistant", "A1")])
        self.assertEqual(
            messages,
            [
                {"role": "system", "content": "S"},
                {"role": "user", "content": "Q1"},
                {"role": "assistant", "content": "A1"},
                {"role": "user", "content": "Q2"},
            ],
        )
