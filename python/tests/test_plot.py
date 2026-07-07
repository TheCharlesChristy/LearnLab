"""Tests for learnsdk.plot.PlotExplorerItem + Ctl (§6.8)."""

import learnsdk._bridge as bridge
from learnsdk import Ctl, PlotExplorerItem


def _make_plot(saved=None, item_id="p"):
    class Item(PlotExplorerItem):
        title = "Linear"
        controls = [
            Ctl("m", "slope", 0.0, 5.0, 0.5, default=2.0),
            Ctl("c", "intercept", -5.0, 5.0, 0.5, default=1.0),
        ]
        x_range = (0.0, 10.0)
        samples = 11

        def f(self, x, m, c):
            return m * x + c

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


def test_ctl_dataclass_fields() -> None:
    c = Ctl("k", "Label", 0, 1, 0.1, default=0.5)
    assert c.key == "k"
    assert c.default == 0.5


def test_renders_slider_per_control_and_a_plot() -> None:
    inst, runtime = _make_plot()
    tree = runtime.render_tree()
    sliders = _find(tree, "Slider", [])
    assert len(sliders) == 2
    plots = _find(tree, "Plot", [])
    assert len(plots) == 1


def test_plot_samples_function_with_current_values() -> None:
    inst, runtime = _make_plot()
    tree = runtime.render_tree()
    plot = _find(tree, "Plot", [])[0]
    points = plot["props"]["series"][0]["points"]
    assert len(points) == 11
    # f(0) = m*0 + c = 1.0 ; f(10) = 2*10 + 1 = 21.0 with defaults
    assert points[0] == [0.0, 1.0]
    assert points[-1] == [10.0, 21.0]


def test_slider_change_updates_plot(posted: list) -> None:
    inst, runtime = _make_plot()
    # First slider (m) controls slope; change to 3.0.
    inst._setter("m")(3.0)
    tree = runtime.render_tree()
    plot = _find(tree, "Plot", [])[0]
    points = plot["props"]["series"][0]["points"]
    assert points[-1] == [10.0, 31.0]  # 3*10 + 1


def test_state_restore_and_persist() -> None:
    inst, _ = _make_plot(saved={"values": {"m": 4.0, "c": 0.0}})
    assert inst.values["m"] == 4.0
    assert inst.values["c"] == 0.0
    assert inst.get_state() == {"_v": 1, "values": {"m": 4.0, "c": 0.0}}


def test_plot_via_bridge(posted: list) -> None:
    source = (
        "from learnsdk import PlotExplorerItem, Ctl\n"
        "class Item(PlotExplorerItem):\n"
        "    controls = [Ctl('a', 'A', 0, 1, 0.1, default=0.5)]\n"
        "    x_range = (0.0, 1.0)\n"
        "    samples = 3\n"
        "    def f(self, x, a):\n"
        "        return a * x\n"
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
    render = next(e for e in posted if e["type"] == "RENDER")
    assert _find(render["payload"]["tree"], "Slider", [])
