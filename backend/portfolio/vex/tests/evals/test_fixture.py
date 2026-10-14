"""The evals' copy of the frontend's reader for the site's Markdown (fixture.site_bundle) against the snapshot the
frontend's own test writes (frontend/src/lib/vexKnowledge.test.ts). Part of the default run: it calls no model."""

import hashlib
import json
from unittest.mock import patch

from django.conf import settings
from django.test import SimpleTestCase

from vex.ai.knowledge import Source
from vex.tests.evals.fixture import SITE_SNAPSHOT, SiteSource, header_title, site_bundle, site_sources


class SiteReaderTestCase(SimpleTestCase):
    def test_the_site_reads_as_the_frontend_publishes_it(self) -> None:
        # Fails when the content, or either reader, changed without the snapshot: rewrite it from the frontend
        # (`npx vitest run -u`), then make this side agree.
        snapshot = json.loads(SITE_SNAPSHOT.read_text(encoding="utf-8"))
        read = {
            locale: [
                {
                    "path": source["path"],
                    "title": source["title"],
                    "sha256": hashlib.sha256(source["text"].encode("utf-8")).hexdigest(),
                }
                for source in site_bundle(locale)
            ]
            for locale, _name in settings.LANGUAGES
        }
        self.assertEqual(read, snapshot)

    def test_the_last_title_line_wins_as_in_the_frontend(self) -> None:
        self.assertEqual(header_title('---\ntitle: First\nsummary: x\r\ntitle: "Second"\n---\nText.'), "Second")

    def test_a_title_is_read_only_from_the_header(self) -> None:
        self.assertEqual(header_title('---\ntitle: ""\n---\ntitle: Body'), "")
        self.assertEqual(header_title("title: No header\n"), "")

    def test_a_source_with_no_text_is_left_out_as_in_production(self) -> None:
        bundle = [
            SiteSource(path="/workshop/empty", title="Empty", text=""),
            SiteSource(path="/workshop/full", title="Full", text="Text."),
        ]
        with patch("vex.tests.evals.fixture.site_bundle", return_value=bundle):
            self.assertEqual(site_sources("en"), [Source("site", "Full", "Text.", "/workshop/full")])
