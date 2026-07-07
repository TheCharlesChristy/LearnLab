"""Tests for learnsdk.simulation.SimulationItem (§6.8)."""

import learnsdk._bridge as bridge
from learnsdk import Column, SimulationItem


def _make_sim(item_id="s"):
    class Item(SimulationItem):
        def tick(self, dt):
            if self.running:
                self.sim_time += dt

        def render(self):
            return Column(self.transport(), key="root")

    inst = Item.__new__(Item)
    runtime = bridge._LoadedItem(inst, item_id)
    inst._framework_init(item_id=item_id, params={}, saved_state=None, seed=0, runtime=runtime)
    inst.setup()
    return inst, runtime


def test_wants_tick_preset() -> None:
    assert SimulationItem.wants_tick is True


def test_initial_transport_state() -> None:
    inst, _ = _make_sim()
    assert inst.running is False
    assert inst.sim_time == 0.0


def test_start_pause_reset() -> None:
    inst, _ = _make_sim()
    inst.start()
    assert inst.running is True
    inst.pause()
    assert inst.running is False
    inst.sim_time = 5.0
    inst.reset_sim()
    assert inst.running is False
    assert inst.sim_time == 0.0


def test_sim_time_accumulates_only_while_running() -> None:
    inst, _ = _make_sim()
    inst.tick(0.1)  # not running
    assert inst.sim_time == 0.0
    inst.start()
    inst.tick(0.1)
    inst.tick(0.2)
    assert abs(inst.sim_time - 0.3) < 1e-9


def test_transport_row_has_three_buttons() -> None:
    inst, runtime = _make_sim()
    tree = runtime.render_tree()

    def find(node, type_, acc):
        if node.get("type") == type_:
            acc.append(node)
        for c in node.get("children", []):
            find(c, type_, acc)
        return acc

    buttons = find(tree, "Button", [])
    labels = {b["props"]["label"] for b in buttons}
    assert labels == {"Play", "Pause", "Reset"}


def test_transport_buttons_wired(posted: list) -> None:
    # Drive through the bridge so handler tokens fire start/pause/reset.
    source = (
        "from learnsdk import SimulationItem, Column\n"
        "class Item(SimulationItem):\n"
        "    def tick(self, dt):\n"
        "        if self.running:\n"
        "            self.sim_time += dt\n"
        "    def render(self):\n"
        "        return Column(self.transport(), key='root')\n"
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
    # h0 = Play
    bridge.dispatch(
        {"v": 1, "id": "e", "type": "EVENT", "payload": {"itemId": "i", "handler": "h0"}}
    )
    assert bridge._items["i"].item.running is True
    bridge.dispatch({"v": 1, "id": "t", "type": "TICK", "payload": {"itemId": "i", "dt": 0.5}})
    assert bridge._items["i"].item.sim_time == 0.5
