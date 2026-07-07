"""Machine-learning / AI domain helpers for LearnLab content (SRS §6.9).

Pure-Python (stdlib ``math`` only — no numpy). Provides loss/activation
primitives and a tiny 1-D linear-regression trainer for teaching gradient
descent.
"""

from __future__ import annotations

import math
from collections.abc import Sequence

__all__ = ["mse", "sigmoid", "train_linreg_1d"]


def mse(ys: Sequence[float], yhats: Sequence[float]) -> float:
    """Compute the mean squared error between targets and predictions.

    Args:
        ys: The true values.
        yhats: The predicted values, same length as ``ys``.

    Returns:
        The mean of ``(y - yhat) ** 2`` over all pairs.

    Raises:
        ValueError: If ``ys`` and ``yhats`` differ in length, or are empty.
    """
    if len(ys) != len(yhats):
        raise ValueError(f"length mismatch: len(ys)={len(ys)} != len(yhats)={len(yhats)}")
    if not ys:
        raise ValueError("cannot compute MSE of empty sequences")
    total = 0.0
    for y, yhat in zip(ys, yhats, strict=True):
        diff = y - yhat
        total += diff * diff
    return total / len(ys)


def sigmoid(x: float) -> float:
    """Compute the logistic sigmoid ``1 / (1 + exp(-x))`` numerically stably.

    The two-branch formulation avoids overflow in ``exp`` for large-magnitude
    inputs: ``sigmoid(-1000) == 0.0`` and ``sigmoid(1000) == 1.0`` instead of
    raising ``OverflowError``.

    Args:
        x: The input value.

    Returns:
        A float in ``(0.0, 1.0)``; ``sigmoid(0.0) == 0.5``.
    """
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def train_linreg_1d(
    points: Sequence[tuple[float, float]], lr: float, epochs: int
) -> list[dict[str, float]]:
    """Fit ``y = w*x + b`` by batch gradient descent on mean squared error.

    Training starts from the fixed initialisation ``w = 0.0``, ``b = 0.0`` (so
    results are deterministic). Each epoch performs one full-batch gradient
    step over all points.

    History shape: a list of ``epochs + 1`` dicts, one per recorded state,
    each with keys ``"epoch"`` (int as float-compatible), ``"w"``, ``"b"`` and
    ``"loss"`` (the MSE at the *start* of that epoch, i.e. before the step).
    Index 0 is the initial state; the final entry is the post-training state
    with its resulting loss.

    Args:
        points: A non-empty sequence of ``(x, y)`` pairs.
        lr: The learning rate (step size).
        epochs: The number of gradient-descent steps (must be >= 0).

    Returns:
        The training history as described above.

    Raises:
        ValueError: If ``points`` is empty or ``epochs`` is negative.
    """
    if not points:
        raise ValueError("points must be non-empty")
    if epochs < 0:
        raise ValueError(f"epochs must be non-negative, got {epochs}")

    w = 0.0
    b = 0.0
    n = len(points)
    history: list[dict[str, float]] = []

    for epoch in range(epochs):
        # Compute predictions, loss, and gradients for the current (w, b).
        sq_err = 0.0
        grad_w = 0.0
        grad_b = 0.0
        for x, y in points:
            yhat = w * x + b
            err = yhat - y
            sq_err += err * err
            grad_w += err * x
            grad_b += err
        loss = sq_err / n
        history.append({"epoch": epoch, "w": w, "b": b, "loss": loss})

        # d(MSE)/dw = (2/n) * sum(err * x); same for b without the x factor.
        grad_w = (2.0 / n) * grad_w
        grad_b = (2.0 / n) * grad_b
        w -= lr * grad_w
        b -= lr * grad_b

    # Record the final state with its resulting loss.
    final_loss = mse([y for _, y in points], [w * x + b for x, _ in points])
    history.append({"epoch": epochs, "w": w, "b": b, "loss": final_loss})
    return history
