"""Tests for courselib.ai (SRS §6.9)."""

import pytest

from courselib.ai import mse, sigmoid, train_linreg_1d


def test_mse_zero():
    assert mse([1, 2, 3], [1, 2, 3]) == 0.0


def test_mse_known():
    # errors: 1, -1, 2 -> squares 1, 1, 4 -> mean 2.0
    assert mse([1, 2, 3], [0, 3, 1]) == pytest.approx(2.0)


def test_mse_length_mismatch_raises():
    with pytest.raises(ValueError):
        mse([1, 2], [1])


def test_mse_empty_raises():
    with pytest.raises(ValueError):
        mse([], [])


def test_sigmoid_zero():
    assert sigmoid(0.0) == 0.5


def test_sigmoid_symmetry():
    assert sigmoid(2.0) + sigmoid(-2.0) == pytest.approx(1.0)


def test_sigmoid_large_positive_stable():
    # Must not raise OverflowError; approaches 1.
    assert sigmoid(1000.0) == pytest.approx(1.0)
    assert sigmoid(710.0) == pytest.approx(1.0)


def test_sigmoid_large_negative_stable():
    assert sigmoid(-1000.0) == pytest.approx(0.0)
    assert sigmoid(-710.0) == pytest.approx(0.0)


def test_sigmoid_range():
    for x in (-5, -1, 0, 1, 5):
        v = sigmoid(x)
        assert 0.0 < v < 1.0


def test_train_linreg_history_shape():
    points = [(0, 1), (1, 3), (2, 5)]  # y = 2x + 1
    history = train_linreg_1d(points, lr=0.05, epochs=10)
    assert len(history) == 11  # epochs + 1
    init_loss = mse([1, 3, 5], [0, 0, 0])
    assert history[0] == {"epoch": 0, "w": 0.0, "b": 0.0, "loss": pytest.approx(init_loss)}
    for entry in history:
        assert set(entry) == {"epoch", "w", "b", "loss"}


def test_train_linreg_loss_decreases():
    points = [(0, 1), (1, 3), (2, 5), (3, 7)]  # y = 2x + 1
    history = train_linreg_1d(points, lr=0.03, epochs=500)
    losses = [h["loss"] for h in history]
    # Monotone-ish: final loss far below initial.
    assert losses[-1] < losses[0]
    assert losses[-1] < 1e-3


def test_train_linreg_converges_to_truth():
    points = [(0, 1), (1, 3), (2, 5), (3, 7), (4, 9)]  # y = 2x + 1
    history = train_linreg_1d(points, lr=0.02, epochs=2000)
    final = history[-1]
    assert final["w"] == pytest.approx(2.0, abs=1e-2)
    assert final["b"] == pytest.approx(1.0, abs=1e-2)


def test_train_linreg_deterministic_init():
    points = [(1, 2), (2, 4)]
    h1 = train_linreg_1d(points, lr=0.01, epochs=5)
    h2 = train_linreg_1d(points, lr=0.01, epochs=5)
    assert h1 == h2
    assert h1[0]["w"] == 0.0 and h1[0]["b"] == 0.0


def test_train_linreg_zero_epochs():
    points = [(0, 1), (1, 3)]
    history = train_linreg_1d(points, lr=0.1, epochs=0)
    assert len(history) == 1
    assert history[0]["epoch"] == 0


def test_train_linreg_empty_points_raises():
    with pytest.raises(ValueError):
        train_linreg_1d([], lr=0.1, epochs=10)


def test_train_linreg_negative_epochs_raises():
    with pytest.raises(ValueError):
        train_linreg_1d([(0, 0)], lr=0.1, epochs=-1)
