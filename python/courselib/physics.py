"""Physics domain helpers for LearnLab content (SRS §6.9).

Pure-Python (stdlib ``math`` only). Provides the standard SUVAT kinematics
solver for uniform acceleration.
"""

from __future__ import annotations

import math
from itertools import combinations

__all__ = ["G", "suvat"]

#: Standard gravitational acceleration near Earth's surface (m/s^2).
G = 9.81

# Relative tolerance used when checking an over-determined (all-five-given,
# or redundant) system for consistency.
_REL_TOL = 1e-6
_ABS_TOL = 1e-9


def _close(x: float, y: float) -> bool:
    """Return True if x and y agree within the module tolerance."""
    return math.isclose(x, y, rel_tol=_REL_TOL, abs_tol=_ABS_TOL)


def suvat(
    s: float | None = None,
    u: float | None = None,
    v: float | None = None,
    a: float | None = None,
    t: float | None = None,
) -> dict[str, float]:
    """Solve the SUVAT (constant-acceleration) equations.

    Given **any three** of the five kinematic quantities, solve for the
    remaining two and return all five. The quantities are:

        * ``s`` — displacement
        * ``u`` — initial velocity
        * ``v`` — final velocity
        * ``a`` — acceleration
        * ``t`` — time

    If more than three are supplied, the extras are treated as constraints and
    checked for consistency.

    Args:
        s: Displacement, or ``None`` if unknown.
        u: Initial velocity, or ``None`` if unknown.
        v: Final velocity, or ``None`` if unknown.
        a: Acceleration, or ``None`` if unknown.
        t: Time, or ``None`` if unknown.

    Returns:
        A dict with keys ``"s"``, ``"u"``, ``"v"``, ``"a"``, ``"t"`` mapping to
        the (now fully determined) float values.

    Raises:
        ValueError: If fewer than three quantities are supplied (under-
            determined), if the supplied values are mutually inconsistent
            (over-determined and contradictory), or if a required quantity
            cannot be solved (e.g. division by zero for the given inputs).
    """
    pairs = (("s", s), ("u", u), ("v", v), ("a", a), ("t", t))
    known = {k: val for k, val in pairs if val is not None}
    if len(known) < 3:
        raise ValueError(
            "suvat is under-determined: need at least 3 known quantities, "
            f"got {len(known)} ({sorted(known)})"
        )

    def solve(state: dict[str, float]) -> dict[str, float]:
        """Iteratively fill in unknowns using whichever SUVAT relation applies."""
        out = dict(state)
        # Loop until no further progress: each pass applies any equation that
        # has exactly one unknown among its variables.
        progressed = True
        while progressed and len(out) < 5:
            progressed = False
            has = out.__contains__

            # v = u + a*t  (involves u, v, a, t)
            if has("u") and has("a") and has("t") and not has("v"):
                out["v"] = out["u"] + out["a"] * out["t"]
                progressed = True
            elif has("v") and has("a") and has("t") and not has("u"):
                out["u"] = out["v"] - out["a"] * out["t"]
                progressed = True
            elif has("v") and has("u") and has("t") and not has("a"):
                if out["t"] == 0:
                    raise ValueError("cannot solve for a: t is zero")
                out["a"] = (out["v"] - out["u"]) / out["t"]
                progressed = True
            elif has("v") and has("u") and has("a") and not has("t"):
                if out["a"] == 0:
                    raise ValueError("cannot solve for t: a is zero (use s = u*t)")
                out["t"] = (out["v"] - out["u"]) / out["a"]
                progressed = True

            if len(out) >= 5:
                break

            # s = (u + v)/2 * t  (involves s, u, v, t)
            if has("u") and has("v") and has("t") and not has("s"):
                out["s"] = (out["u"] + out["v"]) / 2 * out["t"]
                progressed = True
            elif has("s") and has("u") and has("v") and not has("t"):
                denom = out["u"] + out["v"]
                if denom == 0:
                    raise ValueError("cannot solve for t: u + v is zero")
                out["t"] = 2 * out["s"] / denom
                progressed = True
            elif has("s") and has("v") and has("t") and not has("u"):
                if out["t"] == 0:
                    raise ValueError("cannot solve for u: t is zero")
                out["u"] = 2 * out["s"] / out["t"] - out["v"]
                progressed = True
            elif has("s") and has("u") and has("t") and not has("v"):
                if out["t"] == 0:
                    raise ValueError("cannot solve for v: t is zero")
                out["v"] = 2 * out["s"] / out["t"] - out["u"]
                progressed = True

            if len(out) >= 5:
                break

            # s = u*t + 1/2*a*t^2  (involves s, u, a, t)
            if has("u") and has("a") and has("t") and not has("s"):
                out["s"] = out["u"] * out["t"] + 0.5 * out["a"] * out["t"] ** 2
                progressed = True
            elif has("s") and has("a") and has("t") and not has("u"):
                if out["t"] == 0:
                    raise ValueError("cannot solve for u: t is zero")
                out["u"] = (out["s"] - 0.5 * out["a"] * out["t"] ** 2) / out["t"]
                progressed = True
            elif has("s") and has("u") and has("t") and not has("a"):
                if out["t"] == 0:
                    raise ValueError("cannot solve for a: t is zero")
                out["a"] = 2 * (out["s"] - out["u"] * out["t"]) / out["t"] ** 2
                progressed = True

            if len(out) >= 5:
                break

            # v^2 = u^2 + 2*a*s  (involves s, u, v, a) — the only relation that
            # omits t, needed for the {s, u, v, a} / {s, v, a} type cases.
            if has("u") and has("a") and has("s") and not has("v"):
                disc = out["u"] ** 2 + 2 * out["a"] * out["s"]
                if disc < 0:
                    raise ValueError("no real v: u^2 + 2*a*s is negative")
                # Sign convention: v keeps the sign of (u + a*?) — choose the
                # root consistent with motion. Default to non-negative root when
                # u >= 0, else negative. (t-free; ambiguous in general.)
                root = math.sqrt(disc)
                out["v"] = root if out["u"] >= 0 else -root
                progressed = True
            elif has("v") and has("a") and has("s") and not has("u"):
                disc = out["v"] ** 2 - 2 * out["a"] * out["s"]
                if disc < 0:
                    raise ValueError("no real u: v^2 - 2*a*s is negative")
                root = math.sqrt(disc)
                out["u"] = root if out["v"] >= 0 else -root
                progressed = True
            elif has("v") and has("u") and has("s") and not has("a"):
                if out["s"] == 0:
                    raise ValueError("cannot solve for a: s is zero")
                out["a"] = (out["v"] ** 2 - out["u"] ** 2) / (2 * out["s"])
                progressed = True
            elif has("v") and has("u") and has("a") and not has("s"):
                if out["a"] == 0:
                    raise ValueError("cannot solve for s without t when a is zero")
                out["s"] = (out["v"] ** 2 - out["u"] ** 2) / (2 * out["a"])
                progressed = True

        return out

    # Solve from a minimal 3-quantity subset so the derived values are
    # independent of any redundant inputs, which we then verify for
    # consistency. Try subsets until one solves all five (some 3-subsets are
    # degenerate, e.g. cannot disambiguate a sign).
    result: dict[str, float] | None = None
    if len(known) == 3:
        result = solve(known)
        if len(result) < 5:
            result = None
    else:
        for subset_keys in combinations(known, 3):
            subset = {k: known[k] for k in subset_keys}
            try:
                candidate = solve(subset)
            except ValueError:
                continue
            if len(candidate) == 5:
                result = candidate
                break

    if result is None or len(result) < 5:
        raise ValueError(
            f"could not solve all quantities from {sorted(known)} "
            "(degenerate or inconsistent inputs)"
        )

    # Consistency check: every originally-supplied value must match the solved
    # value (catches contradictory over-determined inputs).
    for k, given in known.items():
        if not _close(result[k], given):
            raise ValueError(
                f"inconsistent SUVAT inputs: given {k}={given}, but equations imply {k}={result[k]}"
            )

    return {k: result[k] for k in ("s", "u", "v", "a", "t")}
