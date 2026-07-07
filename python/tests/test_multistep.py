"""Tests for learnsdk.quiz.MultiStepItem + Step (§6.8)."""

import learnsdk._bridge as bridge
from learnsdk import MultiStepItem, Result, Step


def _make(saved=None, item_id="m"):
    class Item(MultiStepItem):
        def steps(self):
            return [
                Step(
                    "Differentiate $x^2$",
                    check=lambda v: Result(str(v).strip() == "2x", "use the power rule"),
                    hint_md="bring the power down",
                ),
                Step(
                    "Evaluate at x=3",
                    check=lambda v: Result(str(v).strip() == "6"),
                ),
            ]

    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, item_id)
    inst._framework_init(item_id=item_id, params={}, saved_state=saved, seed=0, runtime=runtime)
    inst.setup()
    return inst, runtime


def _find(node, type_, acc):
    if node.get("type") == type_:
        acc.append(node)
    for c in node.get("children", []):
        _find(c, type_, acc)
    return acc


def test_advances_only_on_correct(posted: list) -> None:
    inst, _ = _make()
    assert inst._index == 0
    inst._set_draft("wrong")
    inst._submit()
    assert inst._index == 0  # stayed
    assert inst._result is not None and not inst._result.correct

    inst._set_draft("2x")
    inst._submit()
    assert inst._index == 1  # advanced


def test_completion_calls_complete(posted: list) -> None:
    inst, _ = _make()
    inst._set_draft("2x")
    inst._submit()
    inst._set_draft("6")
    inst._submit()
    assert inst._done
    progress = [e for e in posted if e["type"] == "PROGRESS"]
    assert len(progress) == 1
    assert progress[0]["payload"]["kind"] == "completed"


def test_hint_shown_on_request() -> None:
    inst, runtime = _make()
    tree = runtime.render_tree()
    assert "bring the power down" not in str(tree)
    inst._hint()
    tree = runtime.render_tree()
    assert "bring the power down" in str(tree)


def test_state_restore() -> None:
    inst, _ = _make(saved={"index": 1})
    assert inst._index == 1
    assert inst.get_state() == {"_v": 1, "index": 1}


def test_via_bridge(posted: list) -> None:
    source = (
        "from learnsdk import MultiStepItem, Step, Result\n"
        "class Item(MultiStepItem):\n"
        "    def steps(self):\n"
        "        return [Step('one', check=lambda v: Result(v == 'a'))]\n"
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
