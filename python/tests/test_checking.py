"""Tests for learnsdk.checking (§6.9)."""

import importlib.util

import pytest

from learnsdk import Result, checking
from learnsdk.checking import approx, sig_figs, sympy_equiv, vector_equal, within

HAS_SYMPY = importlib.util.find_spec("sympy") is not None


def test_result_dataclass_defaults() -> None:
    r = Result(True)
    assert r.correct is True
    assert r.feedback == ""
    assert Result(False, "no").feedback == "no"


def test_approx_within_and_outside_tolerance() -> None:
    assert approx(1.0, 1.0005, rel=1e-3)
    assert not approx(1.0, 1.5, rel=1e-3)
    # absolute tolerance covers near-zero
    assert approx(0.0, 1e-10)
    assert not approx(0.0, 1e-3)


def test_sig_figs() -> None:
    assert sig_figs(123.456, 2) == 120.0
    assert sig_figs(0.0012345, 3) == 0.00123
    assert sig_figs(0.0, 5) == 0.0
    assert sig_figs(-987.0, 1) == -1000.0


def test_sig_figs_rejects_nonpositive() -> None:
    with pytest.raises(ValueError):
        sig_figs(1.0, 0)


def test_within_inclusive_bounds() -> None:
    assert within(5, 1, 10)
    assert within(1, 1, 10)  # lower bound inclusive
    assert within(10, 1, 10)  # upper bound inclusive
    assert not within(0.99, 1, 10)
    assert not within(10.01, 1, 10)


def test_vector_equal() -> None:
    assert vector_equal([1.0, 2.0], [1.0, 2.0000001])
    assert not vector_equal([1.0, 2.0], [1.0, 2.1])
    assert not vector_equal([1.0], [1.0, 2.0])  # length mismatch


def test_sympy_equiv_returns_result_lazily() -> None:
    # The call path always works (lazy import); assertions below only run with
    # sympy present.
    r = sympy_equiv("x + x", "2*x")
    assert isinstance(r, Result)
    if HAS_SYMPY:
        assert r.correct
    else:
        assert not r.correct
        assert "parse" in r.feedback


@pytest.mark.skipif(not HAS_SYMPY, reason="sympy not installed")
def test_sympy_equiv_equivalence_and_inequivalence() -> None:
    assert sympy_equiv("(x+1)**2", "x**2 + 2*x + 1").correct
    assert not sympy_equiv("x**2", "2*x").correct


@pytest.mark.skipif(not HAS_SYMPY, reason="sympy not installed")
def test_sympy_equiv_parse_error() -> None:
    r = sympy_equiv("x +", "x")
    assert not r.correct
    assert "parse" in r.feedback


@pytest.mark.skipif(not HAS_SYMPY, reason="sympy not installed")
def test_sympy_equiv_multiple_symbols() -> None:
    assert sympy_equiv("a*b", "b*a", symbols="a b").correct


def test_checking_module_reexported() -> None:
    assert hasattr(checking, "approx")
    assert checking.Result is Result
