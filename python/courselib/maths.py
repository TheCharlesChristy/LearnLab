"""Maths domain helpers for LearnLab content (SRS §6.9).

Pure-Python (stdlib ``math`` / ``cmath`` only). Provides a LaTeX polynomial
pretty-printer and a quadratic-root solver.
"""

from __future__ import annotations

import cmath
from collections.abc import Sequence

__all__ = ["poly_str", "quadratic_roots"]


def _fmt_coeff(c: float, *, leading: bool, is_constant: bool) -> str:
    """Format a single (already non-zero) coefficient with its sign.

    Args:
        c: The coefficient value.
        leading: True if this is the first printed term (no leading ``+``).
        is_constant: True if this term has no ``x`` factor (degree 0), in which
            case a magnitude of 1 must still be shown.

    Returns:
        The sign-and-magnitude prefix, e.g. ``"3"``, ``" - 2"``, ``" + "``.
        For non-constant terms a magnitude of 1 collapses to the empty string
        (so the caller prints just ``x`` / ``-x``).
    """
    sign = "-" if c < 0 else "+"
    mag = abs(c)
    # Render integers without a trailing ".0".
    if isinstance(mag, float) and mag.is_integer():
        mag = int(mag)

    if not is_constant and mag == 1:
        body = ""
    else:
        body = str(mag)

    if leading:
        return ("-" + body) if c < 0 else body
    return f" {sign} {body}"


def poly_str(coeffs: Sequence[float]) -> str:
    r"""Render a polynomial as a LaTeX string.

    Convention: ``coeffs`` is **highest-degree-first**. For a list of length
    ``n`` the coefficient at index ``i`` multiplies ``x^(n-1-i)``. For example
    ``[3, 0, -2, 1]`` is ``3x^3 + 0x^2 - 2x + 1`` and renders as
    ``"3x^{3} - 2x + 1"``.

    Rules:
        * Zero coefficients are omitted.
        * A magnitude of 1 on a non-constant term is suppressed (``x`` not ``1x``).
        * ``x^1`` renders as ``x``; ``x^0`` renders as the bare constant.
        * Signs are joined with `` + `` / `` - ``; a leading negative term keeps
          its ``-`` with no spaces.
        * The all-zero polynomial (or an empty input) renders as ``"0"``.

    Args:
        coeffs: Coefficients, highest degree first.

    Returns:
        A LaTeX string suitable for inline maths (no surrounding ``$``).
    """
    n = len(coeffs)
    terms: list[str] = []
    leading = True
    for i, c in enumerate(coeffs):
        if c == 0:
            continue
        power = n - 1 - i
        is_constant = power == 0
        prefix = _fmt_coeff(c, leading=leading, is_constant=is_constant)
        if power == 0:
            var = ""
        elif power == 1:
            var = "x"
        else:
            var = f"x^{{{power}}}"
        terms.append(prefix + var)
        leading = False

    if not terms:
        return "0"
    return "".join(terms)


def quadratic_roots(a: float, b: float, c: float) -> tuple[complex, complex]:
    """Solve ``a*x**2 + b*x + c = 0``.

    Return shape: always a 2-tuple of roots, ``(root1, root2)``. Real roots are
    returned as Python ``float`` (or ``complex`` with a zero imaginary part is
    avoided — real discriminants yield ``float``); complex roots are returned as
    ``complex``. A repeated root is returned twice (``root1 == root2``).

    Args:
        a: Quadratic coefficient (must be non-zero).
        b: Linear coefficient.
        c: Constant coefficient.

    Returns:
        ``(root1, root2)``. Both ``float`` when the discriminant is
        non-negative, both ``complex`` (conjugates) otherwise.

    Raises:
        ValueError: If ``a == 0`` (not a quadratic).
    """
    if a == 0:
        raise ValueError("a must be non-zero for a quadratic equation")

    disc = b * b - 4 * a * c
    if disc >= 0:
        root = disc**0.5
        r1 = (-b + root) / (2 * a)
        r2 = (-b - root) / (2 * a)
        return (r1, r2)
    root = cmath.sqrt(disc)
    r1 = (-b + root) / (2 * a)
    r2 = (-b - root) / (2 * a)
    return (r1, r2)
