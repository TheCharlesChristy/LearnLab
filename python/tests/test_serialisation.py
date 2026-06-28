"""Serialisation tests (§6.4): tokens, keys, caps, numpy, SerializationError."""

import pytest

import learnsdk._bridge as bridge
from learnsdk import Button, Column, Component, SerializationError, Text


def _serialise(root: Component) -> tuple[dict, dict]:
    handlers: dict = {}
    tree = bridge.serialise(root, handlers, bridge._Counter(), bridge._NodeCount())
    return tree, handlers


def test_handler_tokens_depth_first() -> None:
    root = Column(
        Button("a", on_click=lambda v=None: "a"),
        Column(Button("b", on_click=lambda v=None: "b")),
        key="root",
    )
    tree, handlers = _serialise(root)
    assert set(handlers) == {"h0", "h1"}
    assert handlers["h0"]() == "a"
    assert handlers["h1"]() == "b"
    assert tree["children"][0]["props"]["on_click"] == {"__h": "h0"}
    assert tree["children"][1]["children"][0]["props"]["on_click"] == {"__h": "h1"}


def test_tokens_reset_each_render() -> None:
    root = Column(Button("a", on_click=lambda v=None: None), key="root")
    _, h1 = _serialise(root)
    _, h2 = _serialise(root)
    assert list(h1) == ["h0"] == list(h2)


def test_key_defaults_to_position_path() -> None:
    root = Column(Text("x"), Text("y"), key="root")
    tree, _ = _serialise(root)
    assert [c["key"] for c in tree["children"]] == ["0", "1"]


def test_author_key_wins() -> None:
    root = Column(Text("x", key="custom"), key="root")
    tree, _ = _serialise(root)
    assert tree["children"][0]["key"] == "custom"


def test_none_event_prop_omitted() -> None:
    root = Button("a", key="b")  # no on_click
    tree, handlers = _serialise(root)
    assert "on_click" not in tree["props"]
    assert handlers == {}


def test_serialization_error_names_prop() -> None:
    class Weird:
        pass

    root = Column(Text("x"), key="root")
    root.props["bad"] = Weird()
    with pytest.raises(SerializationError) as exc:
        _serialise(root)
    assert "root.props.bad" in str(exc.value)


def test_non_string_dict_key_raises() -> None:
    root = Column(key="root")
    root.props["data"] = {1: "x"}
    with pytest.raises(SerializationError):
        _serialise(root)


def test_hard_cap_raises(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column, Text\n"
        "class Item(LearningItem):\n"
        "    def render(self):\n"
        f"        return Column(*[Text(str(i)) for i in range({bridge.TREE_HARD_CAP + 1})],"
        " key='root')\n"
    )
    bridge.dispatch(
        {
            "v": 1,
            "id": "r",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "huge",
                "sourceUrl": "huge.py",
                "source": source,
                "params": {},
                "savedState": None,
                "seed": 0,
            },
        }
    )
    err = next(e for e in posted if e["type"] == "ERROR")
    assert err["payload"]["phase"] == "load"
    assert "hard cap" in err["payload"]["message"]


def test_soft_cap_warns(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column, Text\n"
        "class Item(LearningItem):\n"
        "    def render(self):\n"
        f"        return Column(*[Text(str(i)) for i in range({bridge.TREE_SOFT_CAP + 5})],"
        " key='root')\n"
    )
    bridge.dispatch(
        {
            "v": 1,
            "id": "r",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "big",
                "sourceUrl": "big.py",
                "source": source,
                "params": {},
                "savedState": None,
                "seed": 0,
            },
        }
    )
    warns = [e for e in posted if e["type"] == "LOG" and e["payload"]["level"] == "warn"]
    assert any("soft cap" in w["payload"]["text"] for w in warns)


def test_numpy_autoconvert() -> None:
    np = pytest.importorskip("numpy")
    root = Column(key="root")
    root.props["scalar"] = np.float64(3.5)
    root.props["array"] = np.array([1, 2, 3])
    tree, _ = _serialise(root)
    assert tree["props"]["scalar"] == 3.5
    assert tree["props"]["array"] == [1, 2, 3]


def test_stale_token_ignored(posted: list) -> None:
    source = (
        "from learnsdk import LearningItem, Column, Button\n"
        "class Item(LearningItem):\n"
        "    def setup(self):\n"
        "        self.n = 0\n"
        "    def bump(self, value=None):\n"
        "        self.n += 1\n"
        "    def render(self):\n"
        "        return Column(Button('go', on_click=self.bump, key='go'), key='root')\n"
    )
    bridge.dispatch(
        {
            "v": 1,
            "id": "r",
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
    before = len([e for e in posted if e["type"] == "RENDER"])
    # h9 was never assigned this render -> stale, ignored with debug log.
    bridge.dispatch(
        {"v": 1, "id": "e", "type": "EVENT", "payload": {"itemId": "i", "handler": "h9"}}
    )
    after = len([e for e in posted if e["type"] == "RENDER"])
    assert after == before  # no re-render
    assert any(e["type"] == "LOG" and e["payload"]["level"] == "debug" for e in posted)
