"""Vex against its golden set, through the real model: `uv run pytest -m eval --no-cov portfolio/vex/tests/evals`
from backend/, with OPENAI_API_KEY set and DATABASE_URL on a Postgres server it can create a test database on. Left
out of the default run: it costs money and its verdicts are a model's. CI runs it when Vex's brain changes
(.github/workflows/vex-evals.yml), three answers a case.

Vex answers from the evals' own knowledge (fixture.py), which holds only what is public plus made-up personal notes;
--eval-live-db answers from the configured database instead. See conftest.py for the other options.

Each answer is checked plainly first (expected facts and links, the contact address, nothing forbidden, the right
language), then, where a case has a rubric, by a judge model (report.JUDGE_MODEL). The judge reads the same knowledge
Vex answered from, so it can tell a fact from an invention."""

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from typing import Literal, cast
from unittest.mock import patch

import pytest
from django.conf import settings
from openai import OpenAIError
from openai.types.shared import ReasoningEffort

from vex.ai.knowledge import KnowledgeBase
from vex.ai.prompt import build_messages
from vex.ai.provider import ChatMessage, Usage, client, stream_completion
from vex.tests.evals.golden import CASES, Case
from vex.tests.evals.report import JUDGE_MODEL, JUDGE_REASONING_EFFORT, REPORT, Call, CaseResult, Run

pytestmark = [pytest.mark.eval, pytest.mark.django_db]

POLISH = re.compile(r"[ąćęłńóśźż]|\b(jest|nie|się|oraz|jego|czy|które|był|mam|tak)\b", re.IGNORECASE)
ENGLISH = re.compile(r"\b(the|is|and|of|his|was|which|you|it|has)\b", re.IGNORECASE)

# Room for the judge's reasoning as well as its verdict, which reasoning counts against.
JUDGE_MAX_TOKENS = 2000

# The same for every case in a language, so the provider caches it: a case's own sources go in the user message, since
# a system message that differs from a cached one only at its end was, in practice, not served from the cache at all.
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
{sources}{conversation}Question: {question}

Answer:
{answer}

The answer passes if: {rubric}

Reply with JSON only: {{"pass": true or false, "reason": "one short sentence"}}"""


def language_of(text: str) -> Literal["pl", "en", "mixed"] | None:
    """The language the text shows more signs of; "mixed" when it shows as many of each, and None when it shows none
    of either: a short answer may have no diacritics and none of the common words ("Dawid uprawia hokej podwodny"),
    and that is no sign of English."""
    polish, english = len(POLISH.findall(text)), len(ENGLISH.findall(text))
    if polish == english:
        return "mixed" if polish else None
    return "pl" if polish > english else "en"


def judge(case: Case, answer: str, knowledge: KnowledgeBase) -> tuple[bool, str, Call]:
    """The judge's verdict on an answer from `knowledge` (the language's, without the case's own sources, which are
    given with the question)."""
    sources = "\n\n".join(source.render() for source in case.sources)
    conversation = "".join(f"Earlier, {turn.role}: {turn.content}\n" for turn in case.history)
    response = client().chat.completions.create(
        model=JUDGE_MODEL,
        messages=[
            {
                "role": "system",
                "content": JUDGE_SYSTEM.format(email=settings.VEX_CONTACT_EMAIL, knowledge=knowledge.text),
            },
            {
                "role": "user",
                "content": JUDGE.format(
                    sources=f"For this question the knowledge also held:\n<knowledge>\n{sources}\n</knowledge>\n\n"
                    if sources
                    else "",
                    conversation=f"{conversation}\n" if conversation else "",
                    question=case.question,
                    answer=answer,
                    rubric=case.rubric,
                ),
            },
        ],
        max_completion_tokens=JUDGE_MAX_TOKENS,
        reasoning_effort=cast(ReasoningEffort, JUDGE_REASONING_EFFORT),
        response_format={"type": "json_object"},
        prompt_cache_key=f"vex-judge-{case.locale}",
    )
    usage = Usage()
    if response.usage:
        usage.read(response.usage)
    verdict = json.loads(response.choices[0].message.content or "{}")
    return bool(verdict.get("pass")), str(verdict.get("reason", "")), Call(JUDGE_MODEL, usage)


def failures(case: Case, answer: str) -> list[str]:
    lowered = answer.lower()
    found = [
        f"missing {expected!r}"
        for expected in case.expect
        if not any(option.lower() in lowered for option in expected.split("|"))
    ]
    found += [f"contains {forbidden!r}" for forbidden in case.forbid if forbidden.lower() in lowered]
    if case.language and (language := language_of(answer)) not in (None, case.language):
        found.append(f"answered in {'a mix of languages' if language == 'mixed' else language}, not {case.language}")
    return found


def failure(error: Exception) -> str:
    """What went wrong with a call, without the provider's message: a rejected key's comes back partly quoted, and
    the reports are published."""
    status = getattr(error, "status_code", None)
    return f"{type(error).__name__}" + (f" ({status})" if status else "")


def run(case: Case, messages: list[ChatMessage], knowledge: KnowledgeBase) -> Run:
    """One answer to the case, checked and judged against `knowledge` (as for judge()). A call that fails fails the
    run, not the whole case."""
    started = time.monotonic()
    usage = Usage()
    calls = [Call(settings.VEX_MODEL, usage)]
    try:
        answer = "".join(stream_completion(messages, cache_key=f"vex-{case.locale}", usage=usage))
    except OpenAIError as error:
        return Run("", time.monotonic() - started, [f"answer failed: {failure(error)}"], calls)
    seconds = time.monotonic() - started
    problems = failures(case, answer)
    if case.rubric:
        try:
            passed, reason, call = judge(case, answer, knowledge)
        except (OpenAIError, json.JSONDecodeError) as error:
            problems.append(f"judge failed: {failure(error)}")
        else:
            calls.append(call)
            if not passed:
                problems.append(f"judge: {reason}")
    return Run(answer, seconds, problems, calls)


@pytest.mark.skipif(not settings.OPENAI_API_KEY, reason="needs OPENAI_API_KEY")
@pytest.mark.parametrize("case", CASES, ids=lambda case: cast(Case, case).name)
def test_golden(case: Case, knowledge: dict[str, KnowledgeBase], request: pytest.FixtureRequest) -> None:
    if "synthetic" in case.tags and request.config.getoption("--eval-live-db"):
        pytest.skip("its facts are the fixture's, not the live database's")
    base = knowledge[case.locale]
    # Vex reads a case's own sources at the end of her knowledge, as she would read a document added to it.
    with patch("vex.ai.prompt.knowledge_base", return_value=replace(base, sources=(*base.sources, *case.sources))):
        messages = build_messages(question=case.question, locale=case.locale, history=list(case.history))
    # The answers to one case are independent, so they are asked at once: a run of the set takes as long as one
    # answer a case, however many it asks for.
    repeats = request.config.getoption("--eval-repeats")
    with ThreadPoolExecutor(max_workers=repeats) as pool:
        runs = list(pool.map(lambda _: run(case, messages, base), range(repeats)))
    result = CaseResult(case, runs)
    REPORT.results.append(result)
    if not result.passed:
        failed = [f"{'; '.join(attempt.problems)}\n\n{attempt.answer}" for attempt in runs if not attempt.passed]
        pytest.fail(f"{result.passes}/{len(runs)} runs passed, {result.needed} needed\n\n" + "\n\n---\n\n".join(failed))
