"""Tests for courselib.cs (SRS §6.9)."""

import pytest

from courselib.cs import to_base, truth_table


def test_to_base_binary():
    assert to_base(10, 2) == "1010"
    assert to_base(1, 2) == "1"


def test_to_base_hex():
    assert to_base(255, 16) == "ff"
    assert to_base(16, 16) == "10"


def test_to_base_36():
    assert to_base(35, 36) == "z"
    assert to_base(36, 36) == "10"


def test_to_base_zero():
    assert to_base(0, 2) == "0"
    assert to_base(0, 16) == "0"
    assert to_base(0, 36) == "0"


def test_to_base_negative():
    assert to_base(-10, 2) == "-1010"
    assert to_base(-255, 16) == "-ff"


def test_to_base_invalid_base_raises():
    with pytest.raises(ValueError):
        to_base(10, 1)
    with pytest.raises(ValueError):
        to_base(10, 37)


def test_truth_table_and():
    table = truth_table(lambda a, b: a and b, 2)
    assert table == [
        ((False, False), False),
        ((False, True), False),
        ((True, False), False),
        ((True, True), True),
    ]


def test_truth_table_xor():
    table = truth_table(lambda a, b: a ^ b, 2)
    assert table == [
        ((False, False), False),
        ((False, True), True),
        ((True, False), True),
        ((True, True), False),
    ]


def test_truth_table_single_input_not():
    table = truth_table(lambda a: not a, 1)
    assert table == [((False,), True), ((True,), False)]


def test_truth_table_row_count():
    assert len(truth_table(lambda a, b, c: a or b or c, 3)) == 8


def test_truth_table_output_coerced_to_bool():
    # `a and b` on bools returns a bool already, but ensure coercion via int fn.
    table = truth_table(lambda a, b: int(a) + int(b), 2)
    assert all(isinstance(out, bool) for _, out in table)
    assert table[0] == ((False, False), False)
    assert table[1] == ((False, True), True)


def test_truth_table_negative_inputs_raises():
    with pytest.raises(ValueError):
        truth_table(lambda: True, -1)
