"""Rendering-branch coverage for QuizItem inputs and feedback (§6.8/§5.4)."""

import pytest

import learnsdk._bridge as bridge
from learnsdk import MCQ, Multi, MultiStepItem, Numeric, QuizItem, Result, TextAnswer


def _find(tree, type_):
    out = []
    if tree.get("type") == type_:
        out.append(tree)
    for c in tree.get("children", []):
        out.extend(_find(c, type_))
    return out


def _quiz(questions):
    class Item(QuizItem):
        shuffle = False

    Item.questions = lambda self: questions
    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, "q")
    inst._framework_init(item_id="q", params={}, saved_state=None, seed=0, runtime=runtime)
    inst.setup()
    return inst, runtime


def test_renders_each_input_type() -> None:
    inst, runtime = _quiz(
        [
            MCQ("a", ["x", "y"], answer=0),
            Multi("b", ["x", "y"], answers=[0]),
            Numeric("c", answer=1),
            TextAnswer("d", accept=["z"]),
        ]
    )
    assert _find(runtime.render_tree(), "RadioGroup")
    # advance through questions, asserting each input component appears
    inst._set_draft(0)
    inst._submit()
    inst._next()
    assert _find(runtime.render_tree(), "CheckboxGroup")
    inst._set_draft([0])
    inst._submit()
    inst._next()
    assert _find(runtime.render_tree(), "NumberInput")
    inst._set_draft(1)
    inst._submit()
    inst._next()
    assert _find(runtime.render_tree(), "TextInput")


def test_feedback_text_shown_for_result_feedback() -> None:
    class Q(Numeric):
        def check(self, value):
            return Result(False, "specific feedback")

    inst, runtime = _quiz([Q("c", answer=1)])
    inst._set_draft(2)
    inst._submit()
    tree = runtime.render_tree()
    texts = [t["props"]["text"] for t in _find(tree, "Text")]
    assert "specific feedback" in texts
    alerts = [a["props"]["text"] for a in _find(tree, "Alert")]
    assert "Incorrect" in alerts


def test_empty_quiz_renders_warning() -> None:
    inst, runtime = _quiz([])
    tree = runtime.render_tree()
    alerts = _find(tree, "Alert")
    assert alerts and alerts[0]["props"]["kind"] == "warning"


def test_multistep_requires_override() -> None:
    inst = MultiStepItem.__new__(MultiStepItem)
    inst._framework_init(item_id="m", params={}, saved_state=None, seed=0, runtime=object())
    with pytest.raises(NotImplementedError):
        inst.steps()


def test_multistep_empty_steps_warning() -> None:
    class Item(MultiStepItem):
        def steps(self):
            return []

    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, "m")
    inst._framework_init(item_id="m", params={}, saved_state=None, seed=0, runtime=runtime)
    inst.setup()
    alerts = _find(runtime.render_tree(), "Alert")
    assert alerts and alerts[0]["props"]["kind"] == "warning"


def test_multistep_done_render() -> None:
    class Item(MultiStepItem):
        def steps(self):
            return []

    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, "m")
    inst._framework_init(item_id="m", params={}, saved_state={"index": 5}, seed=0, runtime=runtime)

    # Force a non-empty step list but a restored index past the end -> done.
    from learnsdk import Step

    Item.steps = lambda self: [Step("p", check=lambda v: Result(True))]
    inst.setup()
    assert inst._done
    tree = runtime.render_tree()
    texts = [t["props"]["text"] for t in _find(tree, "Text")]
    assert any("complete" in t.lower() for t in texts)
