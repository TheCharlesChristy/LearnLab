"""Tests for courselib.physics (SRS §6.9)."""

import pytest

from courselib.physics import G, suvat


def test_gravity_constant():
    assert G == 9.81


def _check_all_keys(result):
    assert set(result) == {"s", "u", "v", "a", "t"}


# A self-consistent reference scenario:
#   u=2, a=3, t=4  ->  v = u + a*t = 14;  s = u*t + 0.5*a*t^2 = 8 + 24 = 32
REF = {"s": 32.0, "u": 2.0, "v": 14.0, "a": 3.0, "t": 4.0}


def test_suvat_missing_s_and_v():
    result = suvat(u=2, a=3, t=4)
    _check_all_keys(result)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_a_and_v():
    # given s, u, t -> a from s = u*t + 0.5*a*t^2, then v
    result = suvat(s=32, u=2, t=4)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_u_and_a():
    # given s, v, t
    result = suvat(s=32, v=14, t=4)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_t_and_s():
    # given u, v, a -> uses v^2 = u^2 + 2as and t = (v-u)/a
    result = suvat(u=2, v=14, a=3)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_u_and_v():
    # given s, a, t
    result = suvat(s=32, a=3, t=4)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_v_and_a():
    # given s, u, t (already covered) -> try s, u, v instead (missing a, t)
    result = suvat(s=32, u=2, v=14)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_s_and_a():
    # given u, v, t
    result = suvat(u=2, v=14, t=4)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_missing_s_and_t():
    # given u, v, a (t-free relation), distinct from missing_t_and_s naming
    result = suvat(u=2, v=14, a=3)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_underdetermined_raises():
    with pytest.raises(ValueError):
        suvat(u=2, t=4)
    with pytest.raises(ValueError):
        suvat()


def test_suvat_inconsistent_overdetermined_raises():
    # All five given but v is wrong (should be 14).
    with pytest.raises(ValueError):
        suvat(s=32, u=2, v=99, a=3, t=4)


def test_suvat_consistent_overdetermined_ok():
    result = suvat(s=32, u=2, v=14, a=3, t=4)
    for k, v in REF.items():
        assert result[k] == pytest.approx(v)


def test_suvat_zero_acceleration():
    # u=v=5, t=2 -> a=0, s = 10
    result = suvat(u=5, v=5, t=2)
    assert result["a"] == pytest.approx(0.0)
    assert result["s"] == pytest.approx(10.0)
