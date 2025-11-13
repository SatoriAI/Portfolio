# pylint: disable=unused-argument
from unittest.mock import MagicMock, patch

import faker
from django.conf import settings
from django.test import TestCase

from vex.ai.database import relational
from vex.ai.database.relational import RelationalContextGetter, get_pipeline, tokenize
from work.tests.factories import ExperienceFactory, ProjectFactory, SkillFactory

fake = faker.Faker()


@patch("vex.ai.database.relational.get_pipeline", return_value=None)
class RelationalContextGetterTestCase(TestCase):
    def test_returns_empty_when_no_keywords(self, mock_get_pipeline: MagicMock) -> None:
        # Populate some data that should be ignored without keywords
        SkillFactory(name="Python")
        ProjectFactory(title="API")
        ExperienceFactory(position="Engineer")

        getter = RelationalContextGetter(question="Tell me a joke")
        docs = getter.get_context()
        self.assertEqual(docs, [])

    def test_fetches_skills_when_question_mentions_skills(self, mock_get_pipeline: MagicMock) -> None:
        SkillFactory(name="Python", description="Language")
        SkillFactory(name="Django", description="Web framework")

        getter = RelationalContextGetter(question="What skills does Dawid have?")
        docs = getter.get_context()

        self.assertGreaterEqual(len(docs), 2)
        text = "\n\n".join(d.page_content for d in docs)
        self.assertIn("Skill:", text)
        self.assertIn("Python", text)
        self.assertIn("Django", text)

    def test_fetches_projects_when_question_mentions_projects(self, mock_get_pipeline: MagicMock) -> None:
        ProjectFactory(title="Portfolio", tags=["django", "pg"])
        getter = RelationalContextGetter(question="List Dawid's projects")
        docs = getter.get_context()
        self.assertGreaterEqual(len(docs), 1)
        combined = "\n\n".join(d.page_content for d in docs)
        self.assertIn("Project:", combined)
        self.assertIn("Portfolio", combined)

    def test_fetches_experience_when_question_mentions_experience(self, mock_get_pipeline: MagicMock) -> None:
        ExperienceFactory(position="Engineer", company="Acme")
        getter = RelationalContextGetter(question="Tell me about his work experience")
        docs = getter.get_context()
        self.assertGreaterEqual(len(docs), 1)
        body = "\n\n".join(d.page_content for d in docs)
        self.assertIn("Experience:", body)
        self.assertIn("Engineer", body)
        self.assertIn("Acme", body)

    def test_limit_per_model_respected(self, mock_get_pipeline: MagicMock) -> None:
        # Create more items than the limit and assert truncation
        for _ in range(15):
            SkillFactory()
        getter = RelationalContextGetter(question="skills", limit_per_model=5)
        docs = getter.get_context()
        # Only Skill is selected by keyword; thus, total docs should be <= 5
        self.assertLessEqual(len(docs), 5)


class TokenizeAndPipelinesTestCase(TestCase):
    def setUp(self) -> None:
        relational.STANZA_PIPELINES.clear()

    def test_get_pipeline_returns_none_on_exception(self) -> None:
        with (
            patch("vex.ai.database.relational.stanza.Pipeline", side_effect=Exception("boom")) as mock_ctor,
            patch("vex.ai.database.relational.stanza.download") as mock_download,
        ):
            pipe = get_pipeline("pl")
            self.assertIsNone(pipe)
            # Called twice: initial attempt + retry after lazy download
            self.assertEqual(mock_ctor.call_count, 2)
            mock_download.assert_called_once_with(
                "pl", processors="tokenize,lemma", model_dir=settings.STANZA_RESOURCES_DIR
            )

    def test_get_pipeline_caches_per_locale(self) -> None:
        fake_pipeline = MagicMock(name="Pipeline")
        with patch("vex.ai.database.relational.stanza.Pipeline", return_value=fake_pipeline) as mock_ctor:
            p1 = get_pipeline("en")
            p2 = get_pipeline("en")
            self.assertIs(p1, p2)
            mock_ctor.assert_called_once_with(
                lang="en",
                processors="tokenize,lemma",
                use_gpu=False,
                tokenize_pretokenized=False,
                dir=settings.STANZA_RESOURCES_DIR,
            )

    def test_tokenize_fallback_without_pipeline(self) -> None:
        with patch("vex.ai.database.relational.get_pipeline", return_value=None):
            out = tokenize(question="Projekt API", locale="pl")
            self.assertIn("projekt", out)
            self.assertIn("api", out)

    def test_tokenize_with_mocked_pipeline(self) -> None:
        # Build a fake doc shape: doc.sentences -> [obj]; sentence.words -> [obj with .lemma]
        class W:
            def __init__(self, lemma: str) -> None:
                self.lemma = lemma

        class S:
            def __init__(self, words: list[W]) -> None:
                self.words = words

        class D:
            def __init__(self) -> None:
                self.sentences = [S([W("projekt"), W("api")])]

        fake_pipeline = MagicMock()
        fake_pipeline.return_value = D()

        with patch("vex.ai.database.relational.stanza.Pipeline", return_value=fake_pipeline):
            relational.STANZA_PIPELINES.clear()
            out = tokenize(question="Cokolwiek", locale="pl")
            self.assertSetEqual(out, {"projekt", "api"})
