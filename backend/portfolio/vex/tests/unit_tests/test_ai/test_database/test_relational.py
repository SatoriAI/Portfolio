# pylint: disable=unused-argument

import faker
from django.test import TestCase

from vex.ai.database.relational import RelationalContextGetter, tokenize
from work.tests.factories import ExperienceFactory, ProjectFactory, SkillFactory

fake = faker.Faker()


class RelationalContextGetterTestCase(TestCase):
    def test_returns_empty_when_no_keywords(self) -> None:
        # Populate some data that should be ignored without keywords
        SkillFactory(name="Python")
        ProjectFactory(title="API")
        ExperienceFactory(position="Engineer")

        getter = RelationalContextGetter(question="Tell me a joke")
        docs = getter.get_context()
        self.assertEqual(docs, [])

    def test_fetches_skills_when_question_mentions_skills(self) -> None:
        SkillFactory(name="Python", description="Language")
        SkillFactory(name="Django", description="Web framework")

        getter = RelationalContextGetter(question="What skills does Dawid have?")
        docs = getter.get_context()

        self.assertGreaterEqual(len(docs), 2)
        text = "\n\n".join(d.page_content for d in docs)
        self.assertIn("Skill:", text)
        self.assertIn("Python", text)
        self.assertIn("Django", text)

    def test_fetches_projects_when_question_mentions_projects(self) -> None:
        ProjectFactory(title="Portfolio", tags=["django", "pg"])
        getter = RelationalContextGetter(question="List Dawid's projects")
        docs = getter.get_context()
        self.assertGreaterEqual(len(docs), 1)
        combined = "\n\n".join(d.page_content for d in docs)
        self.assertIn("Project:", combined)
        self.assertIn("Portfolio", combined)

    def test_fetches_experience_when_question_mentions_experience(self) -> None:
        ExperienceFactory(position="Engineer", company="Acme")
        getter = RelationalContextGetter(question="Tell me about his work experience")
        docs = getter.get_context()
        self.assertGreaterEqual(len(docs), 1)
        body = "\n\n".join(d.page_content for d in docs)
        self.assertIn("Experience:", body)
        self.assertIn("Engineer", body)
        self.assertIn("Acme", body)

    def test_limit_per_model_respected(self) -> None:
        # Create more items than the limit and assert truncation
        for _ in range(15):
            SkillFactory()
        getter = RelationalContextGetter(question="skills", limit_per_model=5)
        docs = getter.get_context()
        # Only Skill is selected by keyword; thus, total docs should be <= 5
        self.assertLessEqual(len(docs), 5)


class TokenizeTestCase(TestCase):
    def test_tokenize_splits_simple_string(self) -> None:
        out = tokenize(question="Projekt API", locale="pl")
        self.assertIn("projekt", out)
        self.assertIn("api", out)

    def test_tokenize_handles_punctuation(self) -> None:
        out = tokenize(question="Hello, world! How are you?", locale="en")
        expected = {"hello", "world", "how", "are", "you"}
        self.assertEqual(out, expected)

    def test_tokenize_handles_empty_string(self) -> None:
        out = tokenize(question="", locale="en")
        self.assertEqual(out, set())
