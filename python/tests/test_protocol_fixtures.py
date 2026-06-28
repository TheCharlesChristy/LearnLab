"""Bridge contract: assert _bridge produces the golden fixtures (§11)."""

import json

from conftest import (
    FIXTURES_DIR,
    load_fixture,
    normalise_envelope,
    normalise_fixture,
)

import learnsdk._bridge as bridge
from learnsdk import Button, Canvas, Column, Slider, Text, draw


def _serialise(root: object) -> dict:
    handlers: dict = {}
    return bridge.serialise(root, handlers, bridge._Counter(), bridge._NodeCount())


def test_manifest_lists_all_fixtures() -> None:
    manifest = load_fixture("manifest.json")
    assert manifest["schemaVersion"] == 1
    files = {f["file"] for f in manifest["fixtures"]}
    for f in files:
        assert (FIXTURES_DIR / f).exists(), f


def test_tree_basic_matches() -> None:
    root = Column(
        Text("Angle"),
        Slider("Angle", 10, 80, 1, 45, on_change=lambda v: None, key="angle"),
        Button("Launch", on_click=lambda value=None: None, key="launch"),
        gap=3,
        key="root",
    )
    assert _serialise(root) == load_fixture("tree-basic.json")


def test_tree_canvas_matches() -> None:
    commands = [
        draw.clear("#0b1220"),
        draw.grid(30, "#1e293b"),
        draw.line(0, 319, 640, 319, color="#475569", width=2),
        draw.circle(120, 200, 2, fill="#7dd3fc"),
        draw.rect(10, 10, 40, 20, stroke="#e2e8f0"),
        draw.polygon([[0, 0], [10, 0], [5, 10]], fill="#22c55e"),
        draw.text(8, 16, "t = 1.20 s"),
        draw.arrow(100, 100, 160, 60),
    ]
    canvas = Canvas(640, 320, commands, on_pointer=lambda e: None, key="sim")
    assert _serialise(canvas) == load_fixture("tree-canvas.json")


# ---- worker -> host envelopes the bridge produces ----

POWER_RULE_SOURCE = """
from learnsdk import LearningItem, Column, Text

class Item(LearningItem):
    title = "Check: the power rule"

    def setup(self):
        self.q = 1

    def render(self):
        return Column(Text(f"Question {self.q} of 4"), gap=2, key="root")
"""


def _load_power_rule(posted: list) -> None:
    bridge.dispatch(
        {
            "v": 1,
            "id": "req-load",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "power-rule-quiz",
                "sourceUrl": "power-rule-quiz.py",
                "source": POWER_RULE_SOURCE,
                "params": {"questions": 4},
                "savedState": None,
                "seed": 1234567,
            },
        }
    )


def test_loaded_envelope_matches(posted: list) -> None:
    _load_power_rule(posted)
    loaded = next(e for e in posted if e["type"] == "LOADED")
    assert normalise_envelope(loaded) == normalise_fixture(load_fixture("envelope-loaded.json"))


def test_render_envelope_matches(posted: list) -> None:
    _load_power_rule(posted)
    render = next(e for e in posted if e["type"] == "RENDER")
    assert normalise_envelope(render) == normalise_fixture(load_fixture("envelope-render.json"))


def test_progress_scored_envelope_matches(posted: list) -> None:
    source = """
from learnsdk import LearningItem, Column

class Item(LearningItem):
    def setup(self):
        self.complete(score=4, max_score=5)

    def render(self):
        return Column(gap=2, key="root")
"""
    bridge.dispatch(
        {
            "v": 1,
            "id": "req",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "power-rule-quiz",
                "sourceUrl": "x.py",
                "source": source,
                "params": {},
                "savedState": None,
                "seed": 0,
            },
        }
    )
    progress = next(e for e in posted if e["type"] == "PROGRESS")
    assert normalise_envelope(progress) == normalise_fixture(load_fixture("envelope-progress.json"))


def test_persist_envelope_matches(posted: list) -> None:
    source = """
from learnsdk import LearningItem, Column

class Item(LearningItem):
    def setup(self):
        self.persist()

    def get_state(self):
        return {"_v": 1, "angle": 45, "speed": 20.0, "best_range": 38.2}

    def render(self):
        return Column(gap=2, key="root")
"""
    bridge.dispatch(
        {
            "v": 1,
            "id": "req",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "projectile",
                "sourceUrl": "x.py",
                "source": source,
                "params": {},
                "savedState": None,
                "seed": 0,
            },
        }
    )
    persist = next(e for e in posted if e["type"] == "PERSIST")
    assert normalise_envelope(persist) == normalise_fixture(load_fixture("envelope-persist.json"))


def test_snippet_result_envelope_matches(posted: list) -> None:
    bridge.dispatch(
        {
            "v": 1,
            "id": "req-snip",
            "type": "RUN_SNIPPET",
            "payload": {"runId": "run-1", "code": "print(42)", "timeoutMs": 1000},
        }
    )
    snip = next(e for e in posted if e["type"] == "SNIPPET_RESULT")
    assert normalise_envelope(snip) == normalise_fixture(
        load_fixture("envelope-snippet-result.json")
    )


def test_error_event_phase_envelope_shape(posted: list) -> None:
    source = """
from learnsdk import LearningItem, Column, Button

class Item(LearningItem):
    def setup(self):
        self.n = 0

    def boom(self, value=None):
        x = 1 / 0

    def render(self):
        return Column(Button("Go", on_click=self.boom, key="go"), gap=2, key="root")
"""
    bridge.dispatch(
        {
            "v": 1,
            "id": "req",
            "type": "LOAD_ITEM",
            "payload": {
                "itemId": "power-rule-quiz",
                "sourceUrl": "power-rule-quiz.py",
                "source": source,
                "params": {},
                "savedState": None,
                "seed": 0,
            },
        }
    )
    bridge.dispatch(
        {
            "v": 1,
            "id": "ev",
            "type": "EVENT",
            "payload": {"itemId": "power-rule-quiz", "handler": "h0", "value": None},
        }
    )
    err = next(e for e in posted if e["type"] == "ERROR")
    fix = load_fixture("envelope-error.json")
    assert err["payload"]["phase"] == fix["payload"]["phase"] == "event"
    assert err["payload"]["itemId"] == fix["payload"]["itemId"]
    assert err["payload"]["message"] == "ZeroDivisionError: division by zero"
    assert "ZeroDivisionError" in err["payload"]["traceback"]
    # traceback uses the real sourceUrl (FR-PYDX-002)
    assert "power-rule-quiz.py" in err["payload"]["traceback"]


def test_unknown_type_errors(posted: list) -> None:
    bridge.dispatch({"v": 1, "id": "x", "type": "WAT", "payload": {}})
    err = next(e for e in posted if e["type"] == "ERROR")
    assert err["payload"]["code"] == "unknown-type"


def test_dispatch_accepts_json_string(posted: list) -> None:
    bridge.dispatch(
        json.dumps(
            {
                "v": 1,
                "id": "req-snip",
                "type": "RUN_SNIPPET",
                "payload": {"runId": "r", "code": "x=1", "timeoutMs": 10},
            }
        )
    )
    assert any(e["type"] == "SNIPPET_RESULT" for e in posted)
