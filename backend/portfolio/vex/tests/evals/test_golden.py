"""Vex against its golden set, through the real model: `pytest -m eval --no-cov portfolio/vex/tests/evals` from
backend/, with OPENAI_API_KEY set, DATABASE_URL on a database that holds the real content, and VEX_SITE_CONTENT_URL
on a running site (the Vite dev server, or a preview of a build). Left out of the default run and of CI: it costs
money (a few cents for the set) and its verdicts are a model's.

Each answer is checked plainly first (expected facts and links, the contact address, nothing forbidden, the right
language), then, where a case has a rubric, by gpt-6-luna as a judge."""

import json
import re
import time
from typing import cast

import pytest
from django.conf import settings

from vex.ai.prompt import build_messages
from vex.ai.provider import Usage, client, stream_completion
from vex.tests.evals.conftest import RESULTS, USAGE
from vex.tests.evals.golden import CASES, Case

pytestmark = [pytest.mark.eval, pytest.mark.django_db]

POLISH = re.compile(r"[ąćęłńóśźż]|\b(jest|nie|się|oraz|jego|czy|które|był|mam|tak)\b", re.IGNORECASE)
ENGLISH = re.compile(r"\b(the|is|and|of|his|was|which|you|it|has)\b", re.IGNORECASE)

JUDGE = """\
You grade one answer from Vex, the assistant on Dawid Hanrahan's portfolio site. Vex answers from a knowledge base \
about Dawid; it should be warm and brief, keep to science, tech and Dawid, never invent facts about him, and \
suggest emailing him when it does not know.

Question: {question}

Answer:
{answer}

The answer passes if: {rubric}

Reply with JSON only: {{"pass": true or false, "reason": "one short sentence"}}"""


def language_of(text: str) -> str:
    return "pl" if len(POLISH.findall(text)) > len(ENGLISH.findall(text)) else "en"


def judge(case: Case, answer: str) -> tuple[bool, str]:
    response = client().chat.completions.create(
        model="gpt-6-luna",
        messages=[{"role": "user", "content": JUDGE.format(question=case.question, answer=answer, rubric=case.rubric)}],
        max_completion_tokens=300,
        reasoning_effort="low",
        response_format={"type": "json_object"},
    )
    usage = Usage()
    if response.usage:
        usage.read(response.usage)
    USAGE.append(usage)
    verdict = json.loads(response.choices[0].message.content or "{}")
    return bool(verdict.get("pass")), str(verdict.get("reason", ""))


def failures(case: Case, answer: str) -> list[str]:
    lowered = answer.lower()
    found = [
        f"missing {expected!r}"
        for expected in case.expect
        if not any(option.lower() in lowered for option in expected.split("|"))
    ]
    found += [f"contains {forbidden!r}" for forbidden in case.forbid if forbidden.lower() in lowered]
    if case.language and language_of(answer) != case.language:
        found.append(f"answered in {language_of(answer)}, not {case.language}")
    return found


@pytest.mark.skipif(not settings.OPENAI_API_KEY, reason="needs OPENAI_API_KEY")
@pytest.mark.parametrize("case", CASES, ids=lambda case: cast(Case, case).name)
def test_golden(case: Case) -> None:
    usage = Usage()
    started = time.monotonic()
    messages = build_messages(question=case.question, locale=case.locale, history=[])
    answer = "".join(stream_completion(messages, cache_key=f"vex-{case.locale}", usage=usage))
    seconds = time.monotonic() - started
    USAGE.append(usage)
    problems = failures(case, answer)
    if case.rubric:
        passed, reason = judge(case, answer)
        if not passed:
            problems.append(f"judge: {reason}")
    verdict = "PASS" if not problems else "FAIL"
    RESULTS.append(
        f"{verdict} {case.name:<24} {seconds:5.1f}s cached {usage.cached_tokens}/{usage.input_tokens}"
        + (f"  {'; '.join(problems)}" if problems else "")
    )
    if problems:
        pytest.fail(f"{problems}\n\n{answer}")
