"""Answer-checking utilities (SRS §6.9).

Small, pure, CPython-testable helpers for marking learner answers, plus the
:class:`Result` dataclass that question :meth:`check` overrides return. Only
:func:`sympy_equiv` touches an optional dependency (``sympy``), imported lazily
so the module imports without it present (§6.11).
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass


@dataclass
class Result:
    """The outcome of marking one answer (§6.9).

    Returned by a question's ``check(value)`` override and by
    :func:`sympy_equiv`. Re-exported as ``learnsdk.Result`` (§6.5).

    Attributes:
        correct: Whether the answer is correct.
        feedback: Optional human-readable feedback shown to the learner.
    """

    correct: bool
    feedback: str = ""


def approx(a: float, b: float, rel: float = 1e-3, abs_tol: float = 1e-9) -> bool:
    """Test whether two numbers are approximately equal (§6.9).

    Uses a combined relative/absolute tolerance, equivalent to
    :func:`math.isclose` with ``rel_tol=rel`` and ``abs_tol=abs_tol``.

    Args:
        a: First value.
        b: Second value.
        rel: Relative tolerance.
        abs_tol: Absolute tolerance (covers values near zero).

    Returns:
        ``True`` if ``a`` and ``b`` are within tolerance.
    """
    return math.isclose(a, b, rel_tol=rel, abs_tol=abs_tol)


def sig_figs(value: float, n: int) -> float:
    """Round ``value`` to ``n`` significant figures (§6.9).

    Args:
        value: The number to round.
        n: The number of significant figures (must be positive).

    Returns:
        ``value`` rounded to ``n`` significant figures (``0.0`` stays ``0.0``).

    Raises:
        ValueError: If ``n`` is not a positive integer.
    """
    if n <= 0:
        raise ValueError("n must be a positive number of significant figures")
    if value == 0:
        return 0.0
    digits = n - int(math.floor(math.log10(abs(value)))) - 1
    return round(value, digits)


def within(value: float, lo: float, hi: float) -> bool:
    """Test whether ``value`` lies in the inclusive range ``[lo, hi]`` (§6.9).

    Args:
        value: The value to test.
        lo: Inclusive lower bound.
        hi: Inclusive upper bound.

    Returns:
        ``True`` if ``lo <= value <= hi``.
    """
    return lo <= value <= hi


def vector_equal(a: Sequence[float], b: Sequence[float], tol: float = 1e-6) -> bool:
    """Test whether two numeric vectors are equal within ``tol`` (§6.9).

    Args:
        a: First vector.
        b: Second vector.
        tol: Absolute per-component tolerance.

    Returns:
        ``True`` if the vectors have equal length and every component pair is
        within ``tol``.
    """
    if len(a) != len(b):
        return False
    return all(abs(x - y) <= tol for x, y in zip(a, b, strict=True))


def sympy_equiv(user: str, target: str, symbols: str = "x") -> Result:
    """Mark ``user`` against ``target`` by symbolic equivalence (§6.9).

    Lazily imports sympy. Both strings are parsed and the difference simplified;
    they are equivalent iff ``simplify(parse_expr(user) - parse_expr(target))``
    is zero. A parse failure (or unavailable sympy) yields an incorrect
    :class:`Result` with a "couldn't parse" message rather than raising.

    Args:
        user: The learner's expression source.
        target: The reference expression source.
        symbols: Space-separated symbol names to declare for parsing.

    Returns:
        A :class:`Result`: correct on symbolic equivalence, otherwise incorrect
        with feedback (parse errors are reported, not raised).
    """
    try:
        from sympy import simplify  # noqa: PLC0415 - lazy (§6.11)
        from sympy import symbols as sym
        from sympy.parsing.sympy_parser import parse_expr  # noqa: PLC0415
    except Exception:
        return Result(False, "couldn't parse: sympy is not available")

    local = {name: s for name, s in zip(_names(symbols), _as_tuple(sym(symbols)), strict=False)}
    try:
        diff = simplify(parse_expr(user, local_dict=local) - parse_expr(target, local_dict=local))
    except Exception:
        return Result(False, f"couldn't parse your answer: {user!r}")
    return Result(bool(diff == 0))


def _names(symbols: str) -> list[str]:
    """Split a space/comma separated symbol spec into individual names."""
    return [s for s in symbols.replace(",", " ").split() if s]


def _as_tuple(value: object) -> tuple:
    """Wrap a single sympy symbol or a tuple of them into a tuple."""
    return value if isinstance(value, tuple) else (value,)
