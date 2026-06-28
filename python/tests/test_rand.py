"""Tests for learnsdk.rand (§6.9)."""

import random

import pytest

from learnsdk.rand import derive_rng, nice_numbers


def test_derive_rng_is_stable() -> None:
    a = derive_rng(random.Random(1), "q1")
    b = derive_rng(random.Random(1), "q1")
    assert [a.random() for _ in range(5)] == [b.random() for _ in range(5)]


def test_derive_rng_differs_by_label() -> None:
    base_seed = 7
    a = derive_rng(random.Random(base_seed), "q1").random()
    b = derive_rng(random.Random(base_seed), "q2").random()
    assert a != b


def test_derive_rng_advances_base() -> None:
    base = random.Random(3)
    s1 = derive_rng(base, "x").random()
    s2 = derive_rng(base, "x").random()
    assert s1 != s2  # base state advanced between calls


def test_nice_numbers_distinct_in_range() -> None:
    rng = random.Random(0)
    nums = nice_numbers(rng, 5, 1, 9)
    assert len(nums) == len(set(nums)) == 5
    assert all(1 <= n <= 9 for n in nums)


def test_nice_numbers_excludes() -> None:
    rng = random.Random(0)
    for _ in range(20):
        nums = nice_numbers(rng, 3, 0, 5, exclude=(0, 1))
        assert 0 not in nums and 1 not in nums


def test_nice_numbers_deterministic() -> None:
    assert nice_numbers(random.Random(11), 4, 1, 20) == nice_numbers(random.Random(11), 4, 1, 20)


def test_nice_numbers_raises_when_too_few() -> None:
    with pytest.raises(ValueError):
        nice_numbers(random.Random(0), 5, 1, 3)
