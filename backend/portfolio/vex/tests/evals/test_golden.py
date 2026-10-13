"""Vex against its golden set, through the real model: `pytest -m eval --no-cov portfolio/vex/tests/evals` from
backend/, with OPENAI_API_KEY set, DATABASE_URL on a database that holds the real content, and VEX_SITE_CONTENT_URL
on a running site (the Vite dev server, or a preview of a build). Left out of the default run and of CI: it costs
money (a few cents for the set) and its verdicts are a model's.

Each answer is checked plainly first (expected facts and links, the contact address, nothing forbidden, the right
language), then, where a case has a rubric, by gpt-6-luna as a judge. The judge reads the same knowledge Vex
answered from, so it can tell a fact from an invention."""

import json
import re
import time
from dataclasses import replace
from typing import cast
from unittest.mock import patch

import pytest
from django.conf import settings

from vex.ai.knowledge import KnowledgeBase, knowledge_base
from vex.ai.prompt import build_messages
from vex.ai.provider import Usage, client, stream_completion
from vex.tests.evals.conftest import MODEL, RESULTS, USAGE
from vex.tests.evals.golden import CASES, Case

pytestmark = [pytest.mark.eval, pytest.mark.django_db]

POLISH = re.compile(r"[ąćęłńóśźż]|\b(jest|nie|się|oraz|jego|czy|które|był|mam|tak)\b", re.IGNORECASE)
ENGLISH = re.compile(r"\b(the|is|and|of|his|was|which|you|it|has)\b", re.IGNORECASE)

# The same for every case in a language (bar a case's own sources, at the end), so the judge's prompt is cached.
JUDGE_SYSTEM = """\
You grade answers from Vex, the assistant on Dawid Hanrahan's portfolio site. Vex answers from the knowledge base \
below; it should be warm and brief, keep to science, tech and Dawid, never invent facts about him (anything about \
Dawid that the knowledge does not state is invented), and suggest emailing him when it does not know. Besides the \
knowledge, its rules give it Dawid's address, {email}, and the site's pages to link to: /, /#projects, /#about, \
/#contact, /experience, /research, /education, /workshop and /workshop/<slug>.

<knowledge>
{knowledge}
</knowledge>"""

JUDGE = """\
{conversation}Question: {question}

Answer:
{answer}

The answer passes if: {rubric}

Reply with JSON only: {{"pass": true or false, "reason": "one short sentence"}}"""


def language_of(text: str) -> str:
    return "pl" if len(POLISH.findall(text)) > len(ENGLISH.findall(text)) else "en"


def judge(case: Case, answer: str, knowledge: KnowledgeBase) -> tuple[bool, str]:
    conversation = "".join(f"Earlier, {turn.role}: {turn.content}\n" for turn in case.history)
    response = client().chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": JUDGE_SYSTEM.format(email=settings.VEX_CONTACT_EMAIL, knowledge=knowledge.text),
            },
            {
                "role": "user",
                "content": JUDGE.format(
                    conversation=f"{conversation}\n" if conversation else "",
                    question=case.question,
                    answer=answer,
                    rubric=case.rubric,
                ),
            },
        ],
        max_completion_tokens=300,
        reasoning_effort="low",
        response_format={"type": "json_object"},
        prompt_cache_key=f"vex-judge-{case.locale}",
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
    real = knowledge_base(case.locale)
    # A case's own sources go at the end, after everything the cache already holds.
    knowledge = replace(real, sources=(*real.sources, *case.sources))
    usage = Usage()
    started = time.monotonic()
    with patch("vex.ai.prompt.knowledge_base", return_value=knowledge):
        messages = build_messages(question=case.question, locale=case.locale, history=list(case.history))
    answer = "".join(stream_completion(messages, cache_key=f"vex-{case.locale}", usage=usage))
    seconds = time.monotonic() - started
    USAGE.append(usage)
    problems = failures(case, answer)
    if case.rubric:
        passed, reason = judge(case, answer, knowledge)
        if not passed:
            problems.append(f"judge: {reason}")
    verdict = "PASS" if not problems else "FAIL"
    RESULTS.append(
        f"{verdict} {case.name:<24} {seconds:5.1f}s cached {usage.cached_tokens}/{usage.input_tokens}"
        + (f"  {'; '.join(problems)}" if problems else "")
    )
    if problems:
        pytest.fail(f"{problems}\n\n{answer}")
