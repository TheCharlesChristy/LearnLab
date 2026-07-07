"""Tests for learnsdk.quiz: question marking + QuizItem flow (§6.8/§4.6)."""

import importlib.util

import pytest

import learnsdk._bridge as bridge
from learnsdk import MCQ, Expression, Multi, Numeric, QuizItem, Result, TextAnswer

HAS_SYMPY = importlib.util.find_spec("sympy") is not None


# ---------------------------------------------------------------------------
# Question marking (§4.6 semantics)
# ---------------------------------------------------------------------------


def test_mcq_marking() -> None:
    q = MCQ("?", ["a", "b", "c"], answer=1)
    assert q.check(1).correct
    assert not q.check(0).correct
    assert not q.check(None).correct


def test_multi_exact_set() -> None:
    q = Multi("?", ["a", "b", "c"], answers=[0, 2])
    assert q.check([0, 2]).correct
    assert q.check([2, 0]).correct  # order-independent
    assert not q.check([0]).correct  # subset is wrong
    assert not q.check([0, 1, 2]).correct  # superset is wrong
    assert not q.check(None).correct


def test_numeric_tolerance_bounds() -> None:
    q = Numeric("?", answer=10.0, tolerance=0.5)
    assert q.check(10.5).correct  # upper bound inclusive
    assert q.check(9.5).correct  # lower bound inclusive
    assert not q.check(10.51).correct
    assert not q.check(9.49).correct


def test_numeric_zero_tolerance_uses_approx() -> None:
    q = Numeric("?", answer=96.0)
    assert q.check(96.0).correct
    assert q.check(96.00001).correct  # tiny float drift accepted
    assert not q.check(97.0).correct


def test_numeric_scientific_and_invalid() -> None:
    q = Numeric("?", answer=1200.0, tolerance=1.0)
    assert q.check("1.2e3").correct  # scientific notation string
    assert not q.check("abc").correct
    assert not q.check(None).correct


def test_text_full_match_case_insensitive() -> None:
    q = TextAnswer("?", accept=["Paris", "paris city"])
    assert q.check("paris").correct
    assert q.check("  PARIS  ").correct  # trimmed + case-folded
    assert not q.check("pari").correct  # partial match rejected
    assert not q.check(None).correct


def test_text_case_sensitive() -> None:
    q = TextAnswer("?", accept=["Paris"], case_sensitive=True)
    assert q.check("Paris").correct
    assert not q.check("paris").correct


def test_expression_marking_path() -> None:
    q = Expression("?", target="2*x", symbols="x")
    assert q.requires == ["sympy"]
    r = q.check("x + x")
    assert isinstance(r, Result)
    if HAS_SYMPY:
        assert r.correct
    r_empty = q.check("")
    assert not r_empty.correct


@pytest.mark.skipif(not HAS_SYMPY, reason="sympy not installed")
def test_expression_equivalence_and_parse_error() -> None:
    q = Expression("?", target="x**2 + 2*x + 1")
    assert q.check("(x+1)**2").correct
    assert not q.check("x**2").correct
    bad = q.check("x +")
    assert not bad.correct
    assert "parse" in bad.feedback


def test_custom_check_override() -> None:
    class Even(Numeric):
        def check(self, value):
            return Result(value is not None and int(value) % 2 == 0, "must be even")

    q = Even("?", answer=0)
    assert q.check(4).correct
    assert not q.check(3).correct


# ---------------------------------------------------------------------------
# QuizItem flow driven directly through the framework
# ---------------------------------------------------------------------------


def _make_quiz(*, shuffle=False, pass_mark=None, item_id="q", seed=0, saved=None):
    class Item(QuizItem):
        pass

    Item.shuffle = shuffle
    Item.pass_mark = pass_mark

    def questions(self):
        return [
            MCQ("Pick b", ["a", "b"], answer=1, explanation="b is right"),
            Numeric("2+2?", answer=4, tolerance=0.0, explanation="four"),
        ]

    Item.questions = questions
    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, item_id)
    inst._framework_init(item_id=item_id, params={}, saved_state=saved, seed=seed, runtime=runtime)
    inst.setup()
    return inst, runtime


def _find(tree, type_):
    out = []
    if tree.get("type") == type_:
        out.append(tree)
    for c in tree.get("children", []):
        out.extend(_find(c, type_))
    return out


def test_one_at_a_time_flow_and_score(posted: list) -> None:
    inst, runtime = _make_quiz()
    # Q1 shown
    tree = runtime.render_tree()
    texts = [t["props"]["text"] for t in _find(tree, "Text")]
    assert any("Question 1 of 2" in t for t in texts)

    # Answer Q1 correctly (MCQ index 1)
    inst._set_draft(1)
    inst._submit()
    assert inst._results[0].correct
    inst._next()

    # Q2 shown
    tree = runtime.render_tree()
    texts = [t["props"]["text"] for t in _find(tree, "Text")]
    assert any("Question 2 of 2" in t for t in texts)

    # Answer Q2 incorrectly
    inst._set_draft(5)
    inst._submit()
    assert not inst._results[1].correct
    inst._next()  # finishes

    assert inst._done
    assert inst.score == 1
    assert inst.max_score == 2
    progress = [e for e in posted if e["type"] == "PROGRESS"]
    assert len(progress) == 1
    assert progress[0]["payload"]["kind"] == "scored"
    assert progress[0]["payload"]["score"] == 1
    assert progress[0]["payload"]["maxScore"] == 2

    # Summary screen renders a review per question
    tree = runtime.render_tree()
    assert len(_find(tree, "Card")) == 2


def test_complete_idempotent_on_finish(posted: list) -> None:
    inst, runtime = _make_quiz()
    inst._submit()
    inst._next()
    inst._submit()
    inst._next()  # finish #1
    inst._finish()  # second call ignored by complete() idempotency
    progress = [e for e in posted if e["type"] == "PROGRESS"]
    assert len(progress) == 1


def test_pass_mark_reporting() -> None:
    inst, _ = _make_quiz(pass_mark=0.5)
    inst._set_draft(1)
    inst._submit()
    inst._next()
    inst._set_draft(4)
    inst._submit()
    inst._next()
    assert inst.passed is True

    inst2, _ = _make_quiz(pass_mark=0.9)
    inst2._set_draft(0)  # wrong
    inst2._submit()
    inst2._next()
    inst2._set_draft(4)
    inst2._submit()
    inst2._next()
    assert inst2.passed is False


def test_try_again_reseeds_and_changes_numbers(posted: list) -> None:
    # A quiz whose questions depend on rng; Try again must regenerate.
    class Item(QuizItem):
        shuffle = False

        def questions(self):
            a = self.rng.randint(1, 1_000_000)
            return [Numeric(f"val {a}", answer=a)]

    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, "r")
    inst._framework_init(item_id="r", params={}, saved_state=None, seed=1, runtime=runtime)
    inst.setup()
    first = inst._questions[0].answer

    inst._try_again()
    assert inst.attempt == 1
    second = inst._questions[0].answer
    assert first != second  # regenerated numbers differ
    # attempt persisted
    persist = [e for e in posted if e["type"] == "PERSIST"]
    assert persist and persist[-1]["payload"]["state"]["attempt"] == 1


def test_get_state_roundtrip_attempt() -> None:
    inst, _ = _make_quiz(saved={"attempt": 3})
    assert inst.attempt == 3
    assert inst.get_state() == {"_v": 1, "attempt": 3}


def test_questions_required_override() -> None:
    inst = QuizItem.__new__(QuizItem)
    inst._framework_init(item_id="x", params={}, saved_state=None, seed=0, runtime=object())
    with pytest.raises(NotImplementedError):
        inst.questions()


def test_quiz_via_bridge_load(posted: list) -> None:
    source = (
        "from learnsdk import QuizItem, MCQ\n"
        "class Item(QuizItem):\n"
        "    shuffle = False\n"
        "    pass_mark = 0.5\n"
        "    def questions(self):\n"
        "        return [MCQ('pick a', ['a','b'], answer=0, explanation='a')]\n"
    )
    bridge.dispatch(
        {
            "v": 1,
            "id": "req",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "i",
                "sourceUrl": "i.py",
                "source": source,
                "params": {},
                "savedState": None,
                "seed": 0,
            },
        }
    )
    assert any(e["type"] == "LOADED" for e in posted)
    render = next(e for e in posted if e["type"] == "RENDER")
    assert render["payload"]["tree"]["type"] == "Column"
