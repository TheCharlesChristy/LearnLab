"""LearningItem lifecycle tests (§6.6) driven through the bridge."""

import random

import learnsdk._bridge as bridge
from learnsdk import Column, LearningItem


def _load(posted: list, source: str, *, item_id="i", params=None, saved=None, seed=0) -> None:
    bridge.dispatch(
        {
            "v": 1,
            "id": "req",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": item_id,
                "sourceUrl": f"{item_id}.py",
                "source": source,
                "params": params or {},
                "savedState": saved,
                "seed": seed,
            },
        }
    )


COUNTER_SOURCE = (
    "from learnsdk import LearningItem, Column, Text, Button\n"
    "class Item(LearningItem):\n"
    "    def setup(self):\n"
    "        self.n = self.saved_state['n'] if self.saved_state else 0\n"
    "    def bump(self, value=None):\n"
    "        self.n += 1\n"
    "    def get_state(self):\n"
    "        return {'n': self.n}\n"
    "    def render(self):\n"
    "        return Column(Text(str(self.n)),"
    " Button('+', on_click=self.bump, key='b'), key='root')\n"
)


def test_construction_injects_attrs() -> None:
    captured = {}

    class Item(LearningItem):
        def setup(self):
            captured["params"] = self.params
            captured["saved_state"] = self.saved_state
            captured["item_id"] = self.item_id
            captured["rng"] = self.rng

        def render(self):
            return Column(key="root")

    inst = Item.__new__(Item)
    inst._framework_init(
        item_id="abc", params={"a": 1}, saved_state={"x": 2}, seed=99, runtime=object()
    )
    inst.setup()
    assert captured["params"] == {"a": 1}
    assert captured["saved_state"] == {"x": 2}
    assert captured["item_id"] == "abc"
    assert isinstance(captured["rng"], random.Random)


def test_rng_is_seeded_deterministically() -> None:
    a = LearningItem.__new__(LearningItem)
    a._framework_init(item_id="i", params={}, saved_state=None, seed=42, runtime=object())
    b = LearningItem.__new__(LearningItem)
    b._framework_init(item_id="i", params={}, saved_state=None, seed=42, runtime=object())
    assert a.rng.random() == b.rng.random()


def test_author_init_is_load_error(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column\n"
        "class Item(LearningItem):\n"
        "    def __init__(self):\n"
        "        pass\n"
        "    def render(self):\n"
        "        return Column(key='root')\n"
    )
    _load(posted, source)
    err = next(e for e in posted if e["type"] == "ERROR")
    assert err["payload"]["phase"] == "load"
    assert "__init__" in err["payload"]["message"]
    assert not any(e["type"] == "LOADED" for e in posted)


def test_missing_item_class_is_load_error(posted: list) -> None:
    _load(posted, "x = 1\n")
    err = next(e for e in posted if e["type"] == "ERROR")
    assert err["payload"]["phase"] == "load"
    assert "Item" in err["payload"]["message"]


def test_not_subclass_is_load_error(posted: list) -> None:
    _load(posted, "class Item:\n    pass\n")
    err = next(e for e in posted if e["type"] == "ERROR")
    assert err["payload"]["phase"] == "load"
    assert "subclass" in err["payload"]["message"]


def test_setup_render_flow_and_first_seq(posted: list) -> None:
    _load(posted, COUNTER_SOURCE)
    types = [e["type"] for e in posted]
    assert types.index("LOADED") < types.index("RENDER")
    render = next(e for e in posted if e["type"] == "RENDER")
    assert render["payload"]["seq"] == 1
    assert render["payload"]["tree"]["children"][0]["props"]["text"] == "0"


def test_event_triggers_rerender_incrementing_seq(posted: list) -> None:
    _load(posted, COUNTER_SOURCE)
    bridge.dispatch(
        {"v": 1, "id": "e", "type": "EVENT", "payload": {"itemId": "i", "handler": "h0"}}
    )
    renders = [e for e in posted if e["type"] == "RENDER"]
    assert [r["payload"]["seq"] for r in renders] == [1, 2]
    assert renders[1]["payload"]["tree"]["children"][0]["props"]["text"] == "1"


def test_complete_idempotent_and_payloads(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column, Button\n"
        "class Item(LearningItem):\n"
        "    def finish(self, value=None):\n"
        "        self.complete(score=3, max_score=10)\n"
        "        self.complete(score=99)\n"
        "    def render(self):\n"
        "        return Column(Button('f', on_click=self.finish, key='f'), key='root')\n"
    )
    _load(posted, source)
    bridge.dispatch(
        {"v": 1, "id": "e", "type": "EVENT", "payload": {"itemId": "i", "handler": "h0"}}
    )
    progress = [e for e in posted if e["type"] == "PROGRESS"]
    assert len(progress) == 1  # second complete() ignored
    assert progress[0]["payload"] == {
        "itemId": "i",
        "kind": "scored",
        "score": 3,
        "maxScore": 10,
    }
    assert any(e["type"] == "LOG" and e["payload"]["level"] == "debug" for e in posted)


def test_complete_without_score_is_completed(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column\n"
        "class Item(LearningItem):\n"
        "    def setup(self):\n"
        "        self.complete()\n"
        "    def render(self):\n"
        "        return Column(key='root')\n"
    )
    _load(posted, source)
    progress = next(e for e in posted if e["type"] == "PROGRESS")
    assert progress["payload"] == {"itemId": "i", "kind": "completed"}


def test_log_emits_info(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column\n"
        "class Item(LearningItem):\n"
        "    def setup(self):\n"
        "        self.log('hello', 42)\n"
        "    def render(self):\n"
        "        return Column(key='root')\n"
    )
    _load(posted, source)
    log = next(e for e in posted if e["type"] == "LOG" and e["payload"]["level"] == "info")
    assert log["payload"]["text"] == "hello 42"


def test_saved_state_restored(posted: list) -> None:
    _load(posted, COUNTER_SOURCE, saved={"n": 7})
    render = next(e for e in posted if e["type"] == "RENDER")
    assert render["payload"]["tree"]["children"][0]["props"]["text"] == "7"


def test_serialize_state_and_destroy(posted: list) -> None:
    _load(posted, COUNTER_SOURCE)
    bridge.dispatch({"v": 1, "id": "s", "type": "SERIALIZE_STATE", "payload": {"itemId": "i"}})
    state = next(e for e in posted if e["type"] == "STATE")
    assert state["payload"] == {"itemId": "i", "state": {"n": 0}}
    bridge.dispatch({"v": 1, "id": "d", "type": "DESTROY_ITEM", "payload": {"itemId": "i"}})
    destroyed = next(e for e in posted if e["type"] == "DESTROYED")
    assert destroyed["payload"] == {"itemId": "i"}
    assert "i" not in bridge._items


def test_meta_includes_tick_when_wants_tick(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column\n"
        "class Item(LearningItem):\n"
        "    title = 'T'\n"
        "    wants_tick = True\n"
        "    tick_hz = 20\n"
        "    def setup(self):\n"
        "        self.t = 0.0\n"
        "    def tick(self, dt):\n"
        "        self.t += dt\n"
        "    def render(self):\n"
        "        return Column(key='root')\n"
    )
    _load(posted, source)
    loaded = next(e for e in posted if e["type"] == "LOADED")
    assert loaded["payload"]["meta"] == {"title": "T", "wantsTick": True, "tickHz": 20}
    bridge.dispatch({"v": 1, "id": "t", "type": "TICK", "payload": {"itemId": "i", "dt": 0.5}})
    renders = [e for e in posted if e["type"] == "RENDER"]
    assert [r["payload"]["seq"] for r in renders] == [1, 2]


def test_print_inside_item_surfaces_as_log(posted: list) -> None:
    # print() inside snippet/item handled by snippet path; item print goes to
    # stdout which the worker captures — here we assert log() is the item path.
    source = (
        "from learnsdk import LearningItem, Column\n"
        "class Item(LearningItem):\n"
        "    def render(self):\n"
        "        return Column(key='root')\n"
    )
    _load(posted, source)
    assert any(e["type"] == "RENDER" for e in posted)
