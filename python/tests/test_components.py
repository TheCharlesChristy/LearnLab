"""Exercise every §6.7 component class and FunctionPlot sampling."""

import learnsdk._bridge as bridge
from learnsdk import (
    Alert,
    Badge,
    Button,
    Canvas,
    Card,
    Checkbox,
    CheckboxGroup,
    CodeBlock,
    Column,
    Divider,
    FunctionPlot,
    Image,
    Markdown,
    Math,
    NumberInput,
    Plot,
    ProgressBar,
    RadioGroup,
    Row,
    Select,
    Slider,
    Spacer,
    Table,
    Text,
    TextInput,
    draw,
)


def _serialise(root: object) -> dict:
    return bridge.serialise(root, {}, bridge._Counter(), bridge._NodeCount())


def test_every_component_serialises() -> None:
    noop = lambda v=None: None  # noqa: E731
    tree = Column(
        Row(Text("hi"), gap=1, wrap=False, align="start"),
        Card(Text("body"), title="T"),
        Divider(),
        Spacer(size=4),
        Markdown("**md**"),
        Math("x^2", display=True),
        Image("a.png", "alt", width=100),
        Alert("careful", kind="warning"),
        Table(["a", "b"], [[1, 2], [3, 4]]),
        CodeBlock("print(1)", language="python"),
        Badge("new", kind="success"),
        ProgressBar(0.5, max=2.0, label="p"),
        Button("go", on_click=noop, kind="ghost", disabled=True),
        Slider("s", 0, 10, 1, 5, on_change=noop, show_value=False),
        NumberInput("n", value=3.0, on_change=noop, min=0, max=10, step=1, unit="m"),
        TextInput("t", value="x", on_change=noop, on_submit=noop, placeholder="ph"),
        Select("sel", ["a", "b"], "a", on_change=noop),
        RadioGroup("rg", ["a", "b"], 0, on_change=noop),
        Checkbox("c", True, on_change=noop),
        CheckboxGroup("cg", ["a", "b"], [0], on_change=noop),
        Plot([{"name": "f", "points": [[0, 0]], "kind": "line"}]),
        Canvas(100, 100, [draw.clear("#000")], on_pointer=noop),
        gap=2,
        key="root",
    )
    node = _serialise(tree)
    types = [c["type"] for c in node["children"]]
    assert "Row" in types and "Canvas" in types and "Plot" in types
    # all 22 direct children serialised
    assert len(node["children"]) == 22


def test_text_color_prop_optional() -> None:
    assert "color" not in _serialise(Text("x"))["props"]
    assert _serialise(Text("x", color="#fff"))["props"]["color"] == "#fff"


def test_function_plot_samples_in_python() -> None:
    fp = FunctionPlot([{"name": "line", "expr": lambda x: 2 * x}], x_range=(0, 4), samples=5)
    node = _serialise(fp)
    assert node["type"] == "Plot"
    series = node["props"]["series"]
    assert series[0]["name"] == "line"
    assert series[0]["kind"] == "line"
    points = series[0]["points"]
    assert points[0] == [0.0, 0.0]
    assert points[-1] == [4.0, 8.0]
    assert len(points) == 5
    # no callable / expr string crossed the boundary
    assert "expr" not in series[0]
