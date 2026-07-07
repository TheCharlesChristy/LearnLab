import json
from pathlib import Path

import pytest

import learnsdk._bridge as bridge

FIXTURES_DIR = Path(__file__).resolve().parents[2] / "tests" / "protocol-fixtures"


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES_DIR / name).read_text())


@pytest.fixture
def posted():
    """Install a recording js_post and return the list of posted envelopes."""
    out: list[dict] = []
    bridge.init(out.append)
    yield out
    bridge.init(lambda _env: None)
    bridge._items.clear()


def normalise_envelope(env: dict) -> dict:
    """Drop the random id/replyTo so an envelope can be compared to a fixture."""
    e = dict(env)
    e.pop("id", None)
    e.pop("replyTo", None)
    return e


def normalise_fixture(fix: dict) -> dict:
    f = dict(fix)
    f.pop("id", None)
    f.pop("replyTo", None)
    return f
