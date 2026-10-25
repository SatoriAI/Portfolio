"""Vex against its golden set, through the real model: `uv run pytest -m eval --no-cov portfolio/vex/tests/evals`
from backend/, with ANTHROPIC_API_KEY set and DATABASE_URL on a Postgres server it can create a test database on. Left
out of the default run: it costs money and its verdicts are a model's. CI runs it when Vex's brain changes
(.github/workflows/vex-evals.yml), three answers a case.

Vex answers, under her real rules, for an invented site owner (owner.py) from the evals' own knowledge about him
(fixture.py): nothing about Dawid is in it. See conftest.py for the options.

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

import httpx2
import pytest
from anthropic import AnthropicError
from django.conf import settings

from vex.ai.knowledge import KnowledgeBase
from vex.ai.prompt import build_messages
from vex.ai.provider import ChatMessage, Refused, Usage, client, stream_completion
from vex.tests.evals.golden import CASES, Case
from vex.tests.evals.report import JUDGE_EFFORT, JUDGE_MODEL, REPORT, Call, CaseResult, Run

pytestmark = [pytest.mark.eval, pytest.mark.django_db]

POLISH = re.compile(r"[ąćęłńóśźż]|\b(jest|nie|się|oraz|jego|czy|które|był|mam|tak)\b", re.IGNORECASE)
ENGLISH = re.compile(r"\b(the|is|and|of|his|was|which|you|it|has)\b", re.IGNORECASE)

# Room for the judge's thinking as well as its verdict, which thinking counts against.
JUDGE_MAX_TOKENS = 4000

# The verdict's shape, which the API holds the judge's reply to.
VERDICT = {
    "type": "object",
    "properties": {"pass": {"type": "boolean"}, "reason": {"type": "string"}},
    "required": ["pass", "reason"],
    "additionalProperties": False,
}

# The same for every case in a language, so the provider caches it: a case's own sources go in the user message, where
# they would otherwise end the cached prefix early.
JUDGE_SYSTEM = """\
You grade answers from Vex, the assistant on {full_name}'s portfolio site. Vex answers from the knowledge base \
below; it should be warm and brief, keep to science, tech and {name}, never invent facts about him (anything about \
{name} that the knowledge does not state is invented), and suggest emailing him when it does not know. Besides the \
knowledge, its rules give it {name}'s address, {email}, and the site's pages to link to: /, /#projects, /#about, \
/#contact, /experience, /research, /education, /workshop and /workshop/<slug>.

<knowledge>
{knowledge}
</knowledge>"""

JUDGE = """\
{sources}{conversation}Question: {question}

Answer:
{answer}

The answer passes if: {rubric}

Give your verdict and its reason in one short sentence."""


class JudgeFailed(Exception):
    """The judge ended without a verdict (named by its stop reason)."""


def language_of(text: str) -> Literal["pl", "en", "mixed"] | None:
    """The language the text shows more signs of; "mixed" when it shows as many of each, and None when it shows none
    of either: a short answer may have no diacritics and none of the common words ("Jan uprawia hokej podwodny"),
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
    response = client().beta.messages.create(
        model=JUDGE_MODEL,
        max_tokens=JUDGE_MAX_TOKENS,
        system=[
            {
                "type": "text",
                "text": JUDGE_SYSTEM.format(
                    full_name=settings.VEX_OWNER_NAME,
                    name=settings.VEX_OWNER_FIRST_NAME,
                    email=settings.VEX_CONTACT_EMAIL,
                    knowledge=knowledge.text,
                ),
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
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
            }
        ],
        output_config={"effort": JUDGE_EFFORT, "format": {"type": "json_schema", "schema": VERDICT}},
    )
    usage = Usage()
    usage.read(response, JUDGE_MODEL)
    if response.stop_reason != "end_turn":
        # A verdict cut short, or a judge that declined: no verdict at all, whatever text came back.
        raise JudgeFailed(f"stopped at {response.stop_reason}")
    verdict = json.loads(next(block.text for block in response.content if block.type == "text"))
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
        answer = "".join(stream_completion(messages, usage=usage))
    except (AnthropicError, httpx2.TransportError) as error:  # the latter, a connection lost mid-answer
        return Run("", time.monotonic() - started, [f"answer failed: {failure(error)}"], calls)
    except Refused:
        return Run("", time.monotonic() - started, [f"answer refused ({usage.model})"], calls)
    seconds = time.monotonic() - started
    problems = failures(case, answer)
    if case.rubric:
        try:
            passed, reason, call = judge(case, answer, knowledge)
        except (AnthropicError, json.JSONDecodeError) as error:
            problems.append(f"judge failed: {failure(error)}")
        except JudgeFailed as error:
            problems.append(f"judge failed: {error}")
        else:
            calls.append(call)
            if not passed:
                problems.append(f"judge: {reason}")
    return Run(answer, seconds, problems, calls)


@pytest.mark.skipif(not settings.ANTHROPIC_API_KEY, reason="needs ANTHROPIC_API_KEY")
@pytest.mark.parametrize("case", CASES, ids=lambda case: cast(Case, case).name)
def test_golden(case: Case, knowledge: dict[str, KnowledgeBase], request: pytest.FixtureRequest) -> None:
    base = knowledge[case.locale]
    # Vex reads a case's own sources at the end of her knowledge, as she would read a document added to it.
    with patch("vex.ai.prompt.knowledge_base", return_value=replace(base, sources=(*base.sources, *case.sources))):
        messages = build_messages(
            question=case.question, locale=case.locale, history=list(case.history), asked_from=case.asked_from
        )
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
