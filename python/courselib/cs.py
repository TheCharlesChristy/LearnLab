"""Computer-science domain helpers for LearnLab content (SRS §6.9).

Pure-Python (stdlib only). Base conversion and boolean truth-table generation.
"""

from __future__ import annotations

from collections.abc import Callable
from itertools import product

__all__ = ["to_base", "truth_table"]

_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz"


def to_base(n: int, b: int) -> str:
    """Convert an integer to its representation in base ``b``.

    Digits above 9 use lowercase letters ``a``..``z`` (so base 16 yields
    ``"ff"``, base 36 yields ``"z"`` for 35).

    Edge cases:
        * ``n == 0`` returns ``"0"`` for any valid base.
        * Negative ``n`` is rendered with a leading ``"-"`` (e.g.
          ``to_base(-10, 2) == "-1010"``).

    Args:
        n: The integer to convert.
        b: The target base, an integer in ``2..36`` inclusive.

    Returns:
        The base-``b`` string representation of ``n``.

    Raises:
        ValueError: If ``b`` is outside ``2..36``.
    """
    if not 2 <= b <= 36:
        raise ValueError(f"base must be in 2..36, got {b}")
    if n == 0:
        return "0"

    negative = n < 0
    n = abs(n)
    digits: list[str] = []
    while n > 0:
        n, rem = divmod(n, b)
        digits.append(_DIGITS[rem])
    if negative:
        digits.append("-")
    return "".join(reversed(digits))


def truth_table(fn: Callable[..., bool], n_inputs: int) -> list[tuple[tuple[bool, ...], bool]]:
    """Build the truth table for a boolean function.

    The function ``fn`` is called with ``n_inputs`` positional boolean
    arguments for every combination of inputs, enumerated in ascending binary
    order: ``(False, ..., False)`` first, ``(True, ..., True)`` last.

    Return shape: a list of ``(inputs_tuple, output)`` rows, where
    ``inputs_tuple`` is a tuple of ``n_inputs`` bools and ``output`` is the
    bool returned by ``fn`` (coerced via ``bool()``). The list has
    ``2 ** n_inputs`` rows.

    Args:
        fn: A callable taking ``n_inputs`` bools and returning a truthy value.
        n_inputs: The number of boolean inputs (must be >= 0).

    Returns:
        The truth table as a list of ``(inputs_tuple, output)`` rows.

    Raises:
        ValueError: If ``n_inputs`` is negative.
    """
    if n_inputs < 0:
        raise ValueError(f"n_inputs must be non-negative, got {n_inputs}")

    rows: list[tuple[tuple[bool, ...], bool]] = []
    for combo in product((False, True), repeat=n_inputs):
        rows.append((combo, bool(fn(*combo))))
    return rows
