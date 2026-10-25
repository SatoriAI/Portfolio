"""The harness's own logic: its options, its language check and its report. Part of the default run: it calls no
model."""

from argparse import ArgumentTypeError

from django.conf import settings
from django.test import SimpleTestCase

from vex.ai.provider import Usage
from vex.tests.evals import options
from vex.tests.evals.golden import Case
from vex.tests.evals.report import Call, CaseResult, Report, Run
from vex.tests.evals.test_golden import failures, language_of


class OptionsTestCase(SimpleTestCase):
    def test_repeats_take_a_whole_number_of_at_least_one(self) -> None:
        for value, count in (("1", 1), ("3", 3), ("10", 10)):
            with self.subTest(value=value):
                self.assertEqual(options.repeats(value), count)

    def test_repeats_refuse_anything_else(self) -> None:
        for value in ("0", "-2", "1.5", "", "three"):
            with (
                self.subTest(value=value),
                self.assertRaisesMessage(ArgumentTypeError, f"must be a whole number of at least 1, not {value!r}"),
            ):
                options.repeats(value)

    def test_the_threshold_takes_a_share_from_zero_to_one(self) -> None:
        for value, fraction in (("0", 0.0), ("0.9", 0.9), ("1", 1.0)):
            with self.subTest(value=value):
                self.assertEqual(options.share(value), fraction)

    def test_the_threshold_refuses_anything_else(self) -> None:
        for value in ("-0.1", "1.5", "90", "nan", "", "most"):
            with (
                self.subTest(value=value),
                self.assertRaisesMessage(ArgumentTypeError, f"must be a share of cases from 0 to 1, not {value!r}"),
            ):
                options.share(value)


class LanguageTestCase(SimpleTestCase):
    def test_the_language_with_more_signs(self) -> None:
        for text, language in (
            ("Jan jest programistą.", "pl"),
            ("Jan is a programmer and a teacher.", "en"),
            ("The answer jest here.", "mixed"),
            ("Jan uprawia hokej podwodny", None),
            ("", None),
        ):
            with self.subTest(text=text):
                self.assertEqual(language_of(text), language)

    def test_a_mixed_answer_fails_the_language_check(self) -> None:
        case = Case("mixed", "Kim jest Jan?", "pl", language="pl")
        self.assertEqual(failures(case, "The answer jest here."), ["answered in a mix of languages, not pl"])
        self.assertEqual(failures(case, "Jan uprawia hokej podwodny"), [])


class ReportTestCase(SimpleTestCase):
    def test_input_read_from_and_written_to_the_cache_is_counted_apart(self) -> None:
        calls = [
            Call(settings.VEX_MODEL, Usage(input_tokens=1000, cached_tokens=800)),
            Call(settings.VEX_MODEL, Usage(input_tokens=500, cached_tokens=0, cache_write_tokens=450)),
        ]
        report = Report(results=[CaseResult(Case("case", "question", "en"), [Run("answer", 1.0, [], calls)])])
        line = "1500 input tokens, 800 of them read from the cache and 450 written to it"
        self.assertEqual(report.tokens(), line)
        self.assertTrue(report.lines()[-1].endswith(f"; {line}"))
