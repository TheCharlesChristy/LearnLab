"""Randomness helpers for deterministic item generation (SRS §6.9).

``self.rng`` is the only sanctioned source of randomness inside an item
(§6.6). These helpers build stable sub-streams off it and draw the kind of
small distinct integers question generators need, all reproducibly.
"""

from __future__ import annotations

import hashlib
import random


def derive_rng(base: random.Random, label: str) -> random.Random:
    """Derive a stable independent sub-stream from ``base``.

    The returned generator is a fresh :class:`random.Random` seeded from the
    current state of ``base`` mixed with ``label``. The same ``base`` state and
    ``label`` always yield the same sub-stream, so authors can name independent
    streams (e.g. ``"question-1"``) without them interfering.

    Args:
        base: The parent generator (typically ``self.rng``).
        label: A name identifying this sub-stream.

    Returns:
        A new :class:`random.Random` seeded deterministically from ``base`` and
        ``label``.
    """
    # Mix a draw from base with the label so the sub-stream depends on both the
    # parent's position and the requested name.
    salt = base.getrandbits(64)
    digest = hashlib.sha256(f"{salt}:{label}".encode()).digest()
    seed = int.from_bytes(digest[:8], "big")
    return random.Random(seed)


def nice_numbers(
    rng: random.Random,
    n: int,
    lo: int,
    hi: int,
    exclude: tuple[int, ...] = (),
) -> list[int]:
    """Draw ``n`` distinct integers from ``[lo, hi]`` excluding some values.

    Useful for generating question parameters that should be small, distinct,
    and avoid degenerate values (e.g. excluding ``0`` or ``1``).

    Args:
        rng: The generator to draw from.
        n: How many distinct integers to return.
        lo: Inclusive lower bound.
        hi: Inclusive upper bound.
        exclude: Values that must not appear in the result.

    Returns:
        A list of ``n`` distinct integers in ``[lo, hi]``, none in ``exclude``.

    Raises:
        ValueError: If the range cannot supply ``n`` distinct eligible values.
    """
    pool = [v for v in range(lo, hi + 1) if v not in exclude]
    if n > len(pool):
        raise ValueError(
            f"cannot draw {n} distinct integers from [{lo}, {hi}] "
            f"excluding {exclude!r} (only {len(pool)} available)"
        )
    return rng.sample(pool, n)
