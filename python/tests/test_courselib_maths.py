"""Tests for courselib.maths (SRS §6.9)."""

import cmath

import pytest

from courselib.maths import poly_str, quadratic_roots


def test_poly_str_basic_highest_degree_first():
    # [3, 0, -2, 1] -> 3x^3 + 0x^2 - 2x + 1
    assert poly_str([3, 0, -2, 1]) == "3x^{3} - 2x + 1"


def test_poly_str_zero_polynomial():
    assert poly_str([0, 0, 0]) == "0"
    assert poly_str([]) == "0"
    assert poly_str([0]) == "0"


def test_poly_str_constant():
    assert poly_str([5]) == "5"
    assert poly_str([-7]) == "-7"


def test_poly_str_unit_coefficients_suppressed():
    assert poly_str([1, 0]) == "x"
    assert poly_str([-1, 0, 0]) == "-x^{2}"
    assert poly_str([1, 1]) == "x + 1"


def test_poly_str_leading_negative_no_space():
    assert poly_str([-3, 2]) == "-3x + 2"


def test_poly_str_negative_middle_terms():
    assert poly_str([2, -3, 0, -4]) == "2x^{3} - 3x^{2} - 4"


def test_poly_str_float_integers_render_clean():
    assert poly_str([3.0, 0.0, 1.0]) == "3x^{2} + 1"


def test_poly_str_x_power_one():
    assert poly_str([4, 0]) == "4x"


def test_quadratic_roots_real_distinct():
    # x^2 - 5x + 6 = 0 -> roots 3, 2
    r1, r2 = quadratic_roots(1, -5, 6)
    assert isinstance(r1, float) and isinstance(r2, float)
    assert sorted([r1, r2]) == pytest.approx([2.0, 3.0])


def test_quadratic_roots_repeated():
    # x^2 - 4x + 4 = 0 -> root 2 (twice)
    r1, r2 = quadratic_roots(1, -4, 4)
    assert r1 == pytest.approx(2.0)
    assert r2 == pytest.approx(2.0)
    assert r1 == r2


def test_quadratic_roots_complex():
    # x^2 + 1 = 0 -> roots i, -i
    r1, r2 = quadratic_roots(1, 0, 1)
    assert isinstance(r1, complex) and isinstance(r2, complex)
    roots = {complex(round(r.real, 9), round(r.imag, 9)) for r in (r1, r2)}
    assert roots == {1j, -1j}


def test_quadratic_roots_complex_conjugates():
    # x^2 + 2x + 5 = 0 -> -1 ± 2i
    r1, r2 = quadratic_roots(1, 2, 5)
    assert r1 == pytest.approx(complex(-1, 2)) or r1 == pytest.approx(complex(-1, -2))
    assert cmath.isclose(r1, r2.conjugate())


def test_quadratic_roots_non_quadratic_raises():
    with pytest.raises(ValueError):
        quadratic_roots(0, 2, 3)
