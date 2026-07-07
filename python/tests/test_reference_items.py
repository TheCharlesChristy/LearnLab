"""Prove the §6.13 / §6.8 reference templates run against the real learnsdk.

These are the files ``npm run new:item`` copies into ``items/<name>.py``: the
§6.13(a) power-rule quiz, the §6.13(b) projectile simulation, and the §6.8
PlotExplorerItem (damped oscillation) plus the blank starter. learnsdk is
stdlib-only (§6.11), so the templates run unmodified in plain CPython.

Each test loads the template file, execs it in a namespace where ``learnsdk``
and ``courselib`` are importable (the same as the worker bridge does in
``_bridge._load_item``), instantiates ``Item`` via the framework path
(``__new__`` + ``_framework_init`` + ``setup``), and drives it headlessly:

  * quiz  — answers questions to reach a score and records a PROGRESS row
            (the headless half of AC-02);
  * sim   — ticks dt steps so the path and sim_time evolve, then persists +
            completes on landing (the headless half of AC-04/AC-10);
  * plot  — renders sliders + a function plot.
"""

import math
from pathlib import Path

import pytest

import learnsdk._bridge as bridge
from learnsdk import (
    LearningItem,
    PlotExplorerItem,
    QuizItem,
    SimulationItem,
)

TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "scripts" / "templates"


def _load_template(name: str):
    """Exec a template the way the bridge does and return its ``Item`` class.

    Builds a fresh namespace with ``learnsdk`` (+ ``courselib``) bound, compiles
    and execs the template source, and returns the ``Item`` attribute.
    """
    path = TEMPLATES_DIR / name
    source = path.read_text()
    ns = bridge._build_namespace(name)
    code = compile(source, str(path), "exec")
    exec(code, ns.__dict__)  # noqa: S102 - template content, same as the worker sandbox
    item_cls = ns.__dict__.get("Item")
    assert item_cls is not None, f"{name} must define `class Item`"
    assert "__init__" not in item_cls.__dict__, f"{name} must not define __init__ (§6.6)"
    return item_cls


def _instantiate(item_cls, *, params=None, saved_state=None, seed=0, item_id="t"):
    """Construct an item via the framework path (no author __init__, §6.2.3)."""
    inst = item_cls.__new__(item_cls)
    runtime = bridge._LoadedItem(inst, item_id)
    inst._framework_init(
        item_id=item_id,
        params=params or {},
        saved_state=saved_state,
        seed=seed,
        runtime=runtime,
    )
    inst.setup()
    return inst, runtime


def _find(tree, type_):
    out = []
    if tree.get("type") == type_:
        out.append(tree)
    for c in tree.get("children", []):
        out.extend(_find(c, type_))
    return out


# ---------------------------------------------------------------------------
# Every template loads, defines Item, subclasses the right base
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("name", "base"),
    [
        ("quiz.py", QuizItem),
        ("simulation.py", SimulationItem),
        ("plot.py", PlotExplorerItem),
        ("blank.py", LearningItem),
    ],
)
def test_template_loads_and_subclasses(name, base) -> None:
    item_cls = _load_template(name)
    assert issubclass(item_cls, base)
    # All templates render headlessly without error.
    _inst, runtime = _instantiate(item_cls)
    tree = runtime.render_tree()
    assert tree["type"]  # a real node


@pytest.mark.parametrize("name", ["simulation.py", "blank.py", "plot.py"])
def test_persisted_state_has_version_guard(name) -> None:
    """get_state() carries the {"_v": 1} version sentinel (§6.10)."""
    item_cls = _load_template(name)
    inst, _ = _instantiate(item_cls)
    assert inst.get_state().get("_v") == 1


# ---------------------------------------------------------------------------
# §6.13(a) power-rule quiz — marks answers + records a score (headless AC-02)
# ---------------------------------------------------------------------------


def test_quiz_template_marks_and_scores(posted: list) -> None:
    item_cls = _load_template("quiz.py")
    assert item_cls.title == "Check: the power rule"
    assert item_cls.pass_mark == 0.75

    # Two power-rule questions + the constant-derivative MCQ.
    inst, runtime = _instantiate(item_cls, params={"questions": 2}, seed=7)
    qs = inst._questions
    assert len(qs) == 3
    kinds = {q.__class__.__name__ for q in qs}
    assert kinds == {"Numeric", "MCQ"}  # power-rule Numerics + constant MCQ

    # First render shows the one-at-a-time flow.
    tree = runtime.render_tree()
    texts = [t["props"]["text"] for t in _find(tree, "Text")]
    assert any("Question 1 of 3" in t for t in texts)

    # Answer every question with its known-correct value, advancing each time.
    for i, q in enumerate(qs):
        correct = q.answer if hasattr(q, "answer") else None
        inst._set_draft(correct)
        inst._submit()
        assert inst._results[i].correct, f"question {i} should mark correct"
        inst._next()

    assert inst._done
    assert inst.score == 3
    assert inst.max_score == 3
    assert inst.passed is True  # 100% >= pass_mark 0.75

    # A single scored PROGRESS row is emitted (the attempts/score record).
    progress = [e for e in posted if e["type"] == "PROGRESS"]
    assert len(progress) == 1
    assert progress[0]["payload"]["kind"] == "scored"
    assert progress[0]["payload"]["score"] == 3
    assert progress[0]["payload"]["maxScore"] == 3


def test_quiz_template_marks_wrong_answer() -> None:
    item_cls = _load_template("quiz.py")
    inst, _ = _instantiate(item_cls, params={"questions": 1}, seed=3)
    # The first power-rule question marked with a deliberately wrong value.
    inst._set_draft(inst._questions[0].answer + 100.0)
    inst._submit()
    assert not inst._results[0].correct


def test_quiz_template_is_deterministic_per_seed() -> None:
    item_cls = _load_template("quiz.py")
    a, _ = _instantiate(item_cls, params={"questions": 4}, seed=11)
    b, _ = _instantiate(item_cls, params={"questions": 4}, seed=11)
    assert [q.answer for q in a._questions[:4]] == [q.answer for q in b._questions[:4]]


# ---------------------------------------------------------------------------
# §6.13(b) projectile — ticks + persists state (headless AC-10/AC-04)
# ---------------------------------------------------------------------------


def test_sim_template_ticks_and_evolves(posted: list) -> None:
    item_cls = _load_template("simulation.py")
    assert item_cls.title == "Projectile motion"
    assert item_cls.tick_hz == 30

    inst, runtime = _instantiate(item_cls, params={"angle": 45})
    assert inst.angle == 45
    assert inst.path == []
    assert inst.sim_time == 0.0

    inst.launch()  # resets path/time and starts the transport
    assert inst.running is True

    dt = 1.0 / 30.0
    # A few ticks: sim_time advances and the path accumulates points.
    for _ in range(5):
        inst.tick(dt)
    assert inst.sim_time == pytest.approx(5 * dt)
    assert len(inst.path) == 5
    # Trajectory is rising early on (positive vy at 45°).
    assert inst.path[-1][1] > 0

    # render() produces a Canvas tree with the trajectory drawn.
    tree = runtime.render_tree()
    assert tree["type"] == "Column"
    canvases = _find(tree, "Canvas")
    assert len(canvases) == 1
    cmds = canvases[0]["props"]["commands"]
    # clear + grid + ground line + one circle per path point.
    assert cmds[0]["op"] == "clear"
    circles = [c for c in cmds if c.get("op") == "circle"]
    assert len(circles) == len(inst.path)


def test_sim_template_lands_persists_and_completes(posted: list) -> None:
    item_cls = _load_template("simulation.py")
    inst, _ = _instantiate(item_cls, params={"angle": 45})
    inst.launch()

    # Run long enough for the projectile to land (y < 0): 2*vy/G seconds.
    vy = inst.speed * math.sin(math.radians(inst.angle))
    flight = 2 * vy / 9.81
    dt = 1.0 / 30.0
    steps = int(flight / dt) + 5
    for _ in range(steps):
        inst.tick(dt)

    assert inst.running is False  # paused on landing
    assert inst.best_range > 0.0  # a real range was recorded

    # Landing persisted state (with the version guard) and completed once.
    persist = [e for e in posted if e["type"] == "PERSIST"]
    assert persist, "landing should persist best_range"
    state = persist[-1]["payload"]["state"]
    assert state["_v"] == 1
    assert state["best_range"] == pytest.approx(inst.best_range)

    progress = [e for e in posted if e["type"] == "PROGRESS"]
    assert len(progress) == 1
    assert progress[0]["payload"]["kind"] == "completed"


def test_sim_template_restores_from_saved_state() -> None:
    """The `s = self.saved_state or {}` guard restores persisted fields."""
    item_cls = _load_template("simulation.py")
    saved = {"_v": 1, "angle": 60, "speed": 33.0, "best_range": 120.5}
    inst, _ = _instantiate(item_cls, saved_state=saved)
    assert inst.angle == 60
    assert inst.speed == 33.0
    assert inst.best_range == 120.5


# ---------------------------------------------------------------------------
# §6.8 plot explorer — renders sliders + a plot
# ---------------------------------------------------------------------------


def test_plot_template_renders_sliders_and_plot() -> None:
    item_cls = _load_template("plot.py")
    assert item_cls.title == "Damped oscillation"
    inst, runtime = _instantiate(item_cls)

    # Control defaults are initialised from the Ctl list.
    assert inst.values["zeta"] == pytest.approx(0.2)
    assert inst.values["w"] == pytest.approx(3.0)

    tree = runtime.render_tree()
    sliders = _find(tree, "Slider")
    assert len(sliders) == 2  # one slider per Ctl
    plots = _find(tree, "Plot")  # FunctionPlot serialises sampled data as a Plot
    assert len(plots) == 1
    series = plots[0]["props"]["series"]
    assert series and series[0]["points"], "FunctionPlot sampled f() into points"


def test_plot_template_f_matches_damped_oscillation() -> None:
    item_cls = _load_template("plot.py")
    inst, _ = _instantiate(item_cls)
    # f(0, ...) of a damped cosine is 1.0.
    assert inst.f(0.0, zeta=0.2, w=3.0) == pytest.approx(1.0)
