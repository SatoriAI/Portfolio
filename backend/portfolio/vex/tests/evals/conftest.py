import pytest
from _pytest.terminal import TerminalReporter

from vex.ai.provider import Usage

# gpt-6-luna's prices, in dollars per million tokens: input, cached input, output.
PRICES = (0.10, 0.01, 0.50)

# One line per case, and every call's usage (answers and judgements), for the summary at the end of the run.
RESULTS: list[str] = []
USAGE: list[Usage] = []


@pytest.fixture(scope="session")
def django_db_setup() -> None:
    """Evals read the real knowledge base, so they run on the configured database (DATABASE_URL), not on an empty
    test copy. Each test still runs in a transaction that is rolled back, and the evals write nothing anyway."""


def cost(usage: Usage) -> float:
    fresh = usage.input_tokens - usage.cached_tokens
    return (fresh * PRICES[0] + usage.cached_tokens * PRICES[1] + usage.output_tokens * PRICES[2]) / 1_000_000


def pytest_terminal_summary(terminalreporter: TerminalReporter) -> None:
    if not RESULTS:
        return
    terminalreporter.section("Vex evals")
    for line in RESULTS:
        terminalreporter.write_line(line)
    passed = sum(line.startswith("PASS") for line in RESULTS)
    cached = sum(usage.cached_tokens for usage in USAGE)
    total = sum(usage.input_tokens for usage in USAGE)
    terminalreporter.write_line(
        f"{passed}/{len(RESULTS)} passed; {len(USAGE)} calls, {total} input tokens ({cached} cached), "
        f"{sum(usage.output_tokens for usage in USAGE)} output tokens, ~${sum(map(cost, USAGE)):.4f} at luna prices"
    )
