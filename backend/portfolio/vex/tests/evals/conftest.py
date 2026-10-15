"""How an eval run is set up and judged as a whole: whose site Vex speaks for, the knowledge she answers from, and the
gate. Its options (--eval-repeats, --eval-threshold, --eval-json, --eval-markdown) are declared in
portfolio/conftest.py.

A run passes when at least --eval-threshold of its cases pass, not only when every one does: the answers are a
model's, and a case that fails one run in a hundred would otherwise fail the whole set now and then."""

from collections.abc import Iterator
from unittest.mock import patch

import pytest
from _pytest.config import Config, ExitCode
from _pytest.main import Session
from _pytest.terminal import TerminalReporter
from django.conf import settings
from django.test import override_settings
from pytest_django import DjangoDbBlocker

from vex.ai.knowledge import KnowledgeBase, build
from vex.tests.evals import fixture, owner
from vex.tests.evals.report import JUDGE_MODEL, REPORT


def pytest_configure(config: Config) -> None:
    REPORT.repeats = config.getoption("--eval-repeats")
    REPORT.threshold = config.getoption("--eval-threshold")


@pytest.fixture(scope="package", autouse=True)
def site_owner() -> Iterator[None]:
    """Vex's real rules, speaking for the invented owner of the evals' knowledge rather than for Dawid. For this
    package only: the rest of the suite runs with the settings' own."""
    with override_settings(
        VEX_OWNER_NAME=owner.NAME, VEX_OWNER_FIRST_NAME=owner.FIRST_NAME, VEX_CONTACT_EMAIL=owner.EMAIL
    ):
        yield


@pytest.fixture(scope="package")
def knowledge(
    site_owner: None,  # pylint: disable=redefined-outer-name,unused-argument
    django_db_setup: None,  # pylint: disable=unused-argument
    django_db_blocker: DjangoDbBlocker,
) -> dict[str, KnowledgeBase]:
    """The knowledge base per language, built once for the run (this package is the run); no frontend needs to be
    running."""
    if JUDGE_MODEL not in settings.VEX_PRICES:
        # Checked here rather than at start-up, so a stray variable cannot stop the rest of the suite.
        pytest.fail(f"VEX_EVAL_JUDGE_MODEL={JUDGE_MODEL!r} has no price in VEX_PRICES", pytrace=False)
    with django_db_blocker.unblock():
        fixture.load()
        with patch("vex.ai.knowledge.site_sources", fixture.site_sources):
            bases = {code: build(code) for code, _name in settings.LANGUAGES}
    REPORT.digests = {code: base.digest for code, base in bases.items()}
    return bases


def pytest_sessionfinish(session: Session, exitstatus: int) -> None:
    if not REPORT.results:
        return
    REPORT.write(session.config.getoption("--eval-json"), session.config.getoption("--eval-markdown"))
    # Failed cases fail their tests, so they show; the run as a whole is judged by the threshold, as long as nothing
    # else failed (an error in a test is no verdict on Vex).
    failed_cases = sum(not result.passed for result in REPORT.results)
    if exitstatus == ExitCode.TESTS_FAILED and session.testsfailed == failed_cases and REPORT.ok:
        session.exitstatus = ExitCode.OK


def pytest_terminal_summary(terminalreporter: TerminalReporter) -> None:
    if not REPORT.results:
        return
    terminalreporter.section("Vex evals")
    for line in REPORT.lines():
        terminalreporter.write_line(line)
