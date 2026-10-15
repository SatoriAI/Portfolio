"""What an eval run found, gathered as the cases run and written out at the end: to the terminal, as JSON (every
answer, verdict and call, for a closer look) and as a Markdown table (GitHub's step summary)."""

import json
import math
import os
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from django.conf import settings

from vex.ai.prompt import PROMPT_VERSION
from vex.ai.provider import Usage
from vex.tests.evals.golden import Case

# The judge: a stronger model than the one it grades, and one that does not take the effort "none".
JUDGE_MODEL = os.environ.get("VEX_EVAL_JUDGE_MODEL", "gpt-6.1-sol")
JUDGE_REASONING_EFFORT = "low"


@dataclass(frozen=True)
class Call:
    model: str
    usage: Usage

    @property
    def cost(self) -> Decimal:
        return self.usage.cost(self.model)


@dataclass
class Run:
    """One answer to a case, and what was wrong with it; it passes with nothing wrong."""

    answer: str
    seconds: float
    problems: list[str]
    calls: list[Call]

    @property
    def passed(self) -> bool:
        return not self.problems


@dataclass
class CaseResult:
    case: Case
    runs: list[Run]

    @property
    def passes(self) -> int:
        return sum(run.passed for run in self.runs)

    @property
    def needed(self) -> int:
        """At least two thirds of the runs: a case that passes two answers in three is right, if not reliably so."""
        return math.ceil(2 * len(self.runs) / 3)

    @property
    def passed(self) -> bool:
        return self.passes >= self.needed

    @property
    def problems(self) -> list[str]:
        """Every run's problems, each named once."""
        return list(dict.fromkeys(problem for run in self.runs for problem in run.problems))


@dataclass
class Report:
    repeats: int = 1
    threshold: float = 0.9
    digests: dict[str, str] = field(default_factory=dict)
    results: list[CaseResult] = field(default_factory=list)

    @property
    def calls(self) -> list[Call]:
        return [call for result in self.results for run in result.runs for call in run.calls]

    @property
    def cost(self) -> Decimal:
        return sum((call.cost for call in self.calls), Decimal(0))

    @property
    def pass_rate(self) -> float:
        return sum(result.passed for result in self.results) / len(self.results) if self.results else 0.0

    @property
    def ok(self) -> bool:
        return self.pass_rate >= self.threshold

    def headline(self) -> str:
        passed = sum(result.passed for result in self.results)
        return (
            f"{passed}/{len(self.results)} cases passed ({self.pass_rate:.0%}, {self.threshold:.0%} needed), "
            f"{self.repeats} run(s) each; ${self.cost:.4f} for {len(self.calls)} calls"
        )

    def setup(self) -> dict[str, Any]:
        return {
            "prompt_version": PROMPT_VERSION,
            "model": settings.VEX_MODEL,
            "reasoning_effort": settings.VEX_REASONING_EFFORT,
            "judge": JUDGE_MODEL,
            "judge_reasoning_effort": JUDGE_REASONING_EFFORT,
            "knowledge_digests": self.digests,
            "repeats": self.repeats,
            "threshold": self.threshold,
        }

    def lines(self) -> list[str]:
        """One line per case, for the terminal."""
        lines = []
        for result in self.results:
            seconds = max(run.seconds for run in result.runs)
            problems = "; ".join(result.problems)
            lines.append(
                f"{'PASS' if result.passed else 'FAIL'} {result.case.name:<24} {result.passes}/{len(result.runs)} "
                f"{seconds:5.1f}s" + (f"  {problems}" if problems else "")
            )
        return [*lines, f"{self.headline()}; {self.tokens()}"]

    def tokens(self) -> str:
        """The input tokens of every call, and how many of them the provider served from its cache (billed at the
        cached price; the rest at the full one)."""
        total = sum(call.usage.input_tokens for call in self.calls)
        cached = sum(call.usage.cached_tokens for call in self.calls)
        return f"{total} input tokens, {cached} of them cached and {total - cached} uncached"

    def to_json(self) -> dict[str, Any]:
        return {
            **self.setup(),
            "pass_rate": self.pass_rate,
            "passed": self.ok,
            "cost_usd": str(self.cost),
            "cases": [
                {
                    "case": result.case.name,
                    "tags": list(result.case.tags),
                    "passed": result.passed,
                    "runs_passed": result.passes,
                    "runs_needed": result.needed,
                    "runs": [
                        {
                            "passed": run.passed,
                            "problems": run.problems,
                            "answer": run.answer,
                            "seconds": round(run.seconds, 1),
                            "cost_usd": str(sum((call.cost for call in run.calls), Decimal(0))),
                            "calls": [
                                {
                                    "model": call.model,
                                    "input_tokens": call.usage.input_tokens,
                                    "cached_tokens": call.usage.cached_tokens,
                                    "output_tokens": call.usage.output_tokens,
                                    "reasoning_tokens": call.usage.reasoning_tokens,
                                }
                                for call in run.calls
                            ],
                        }
                        for run in result.runs
                    ],
                }
                for result in self.results
            ],
        }

    def to_markdown(self) -> str:
        setup = self.setup()
        rows = [
            f"| {'✅' if result.passed else '❌'} | `{result.case.name}` | {result.passes}/{len(result.runs)} | "
            + escape_cell("; ".join(result.problems))
            + " |"
            for result in self.results
        ]
        return "\n".join(
            [
                f"## Vex evals: {'passed' if self.ok else 'failed'}",
                "",
                self.headline(),
                "",
                f"Model `{setup['model']}` ({setup['reasoning_effort']}), judge `{setup['judge']}` "
                f"({setup['judge_reasoning_effort']}), prompt `{setup['prompt_version']}`.",
                "",
                "| | Case | Runs passed | Problems |",
                "|---|---|---|---|",
                *rows,
                "",
            ]
        )

    def write(self, json_path: str | None, markdown_path: str | None) -> None:
        if json_path:
            with open(json_path, "w", encoding="utf-8") as file:
                json.dump(self.to_json(), file, ensure_ascii=False, indent=2)
        if markdown_path:
            # Appended: GitHub's step summary file may already hold what earlier steps wrote.
            with open(markdown_path, "a", encoding="utf-8") as file:
                file.write(self.to_markdown())


def escape_cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")


REPORT = Report()
