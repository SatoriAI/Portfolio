"""The types of the evals' numeric options (declared in portfolio/conftest.py): a value out of range stops the run
before it starts, with pytest's usage message, rather than spending money on a run that cannot mean anything."""

import argparse


def repeats(value: str) -> int:
    """--eval-repeats: answers per case, a whole number of at least 1."""
    try:
        count = int(value)
        if count < 1:
            raise ValueError(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f"must be a whole number of at least 1, not {value!r}") from error
    return count


def share(value: str) -> float:
    """--eval-threshold: the share of cases that must pass, from 0 (a run that only reports) to 1 (every case)."""
    try:
        fraction = float(value)
        if not 0 <= fraction <= 1:  # NaN included: it compares false with everything.
            raise ValueError(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f"must be a share of cases from 0 to 1, not {value!r}") from error
    return fraction
