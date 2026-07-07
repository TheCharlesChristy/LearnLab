"""The §6.7 component library (normative).

Authors build a UI by composing these classes and returning the root from
``render()``. Each component is a thin, declarative node: positional children
where natural, keyword props, and an optional ``key`` for reconciliation
(§6.4 rule 3). Callables passed as event props (``on_click``, ``on_change``,
``on_submit``, ``on_pointer``) are kept as Python callables on the node and
replaced with ``{"__h": token}`` at serialise time by the bridge (§6.4 rule 2).

The set is closed: it mirrors ``COMPONENT_TYPES`` in
``src/python/component-tree.ts``. ``FunctionPlot`` is the one exception — it is
a Python-only convenience that samples its functions in Python and emits a
``Plot`` node, so no expression strings ever cross the boundary (§6.7).
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


class Component:
    """Base class for every §6.7 component.

    A component carries its wire ``type``, an optional author ``key``, a
    ``props`` dict (event props may be Python callables, replaced with handler
    refs at serialise time) and a list of child components. The bridge walks
    this structure to produce the JSON tree of §6.4.

    Attributes:
        type: The wire component type (a member of the closed set §6.7).
        key: The author-supplied key, or ``None`` to default to a position path.
        props: The component's properties.
        children: Child components (empty for leaf components).
    """

    type: str = "Component"

    def __init__(
        self,
        *children: Component,
        key: str | None = None,
        **props: Any,
    ) -> None:
        """Initialise a component node.

        Args:
            *children: Child components.
            key: Optional reconciliation key.
            **props: The component's properties.
        """
        self.key = key
        self.children: list[Component] = list(children)
        self.props: dict[str, Any] = props


# ---------------------------------------------------------------------------
# Layout
# ---------------------------------------------------------------------------


class Column(Component):
    """Vertical flex container (§6.7)."""

    type = "Column"

    def __init__(self, *children: Component, gap: int = 2, key: str | None = None) -> None:
        """Stack children vertically.

        Args:
            *children: Child components.
            gap: Gap between children in Tailwind spacing units.
            key: Optional reconciliation key.
        """
        super().__init__(*children, key=key, gap=gap)


class Row(Component):
    """Horizontal flex container (§6.7)."""

    type = "Row"

    def __init__(
        self,
        *children: Component,
        gap: int = 2,
        wrap: bool = True,
        align: str = "center",
        key: str | None = None,
    ) -> None:
        """Lay children out in a row.

        Args:
            *children: Child components.
            gap: Gap between children in Tailwind spacing units.
            wrap: Whether children wrap onto multiple lines.
            align: Cross-axis alignment.
            key: Optional reconciliation key.
        """
        super().__init__(*children, key=key, gap=gap, wrap=wrap, align=align)


class Card(Component):
    """Padded surface grouping children (§6.7)."""

    type = "Card"

    def __init__(
        self, *children: Component, title: str | None = None, key: str | None = None
    ) -> None:
        """Group children inside a padded card.

        Args:
            *children: Child components.
            title: Optional card title.
            key: Optional reconciliation key.
        """
        super().__init__(*children, key=key, title=title)


class Divider(Component):
    """Horizontal rule (§6.7)."""

    type = "Divider"

    def __init__(self, key: str | None = None) -> None:
        """Create a divider.

        Args:
            key: Optional reconciliation key.
        """
        super().__init__(key=key)


class Spacer(Component):
    """Empty space (§6.7)."""

    type = "Spacer"

    def __init__(self, size: int = 2, key: str | None = None) -> None:
        """Create vertical/horizontal space.

        Args:
            size: Space in Tailwind spacing units.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, size=size)


# ---------------------------------------------------------------------------
# Display
# ---------------------------------------------------------------------------


class Text(Component):
    """A run of styled text (§6.7)."""

    type = "Text"

    def __init__(
        self,
        text: str,
        size: str = "md",
        weight: str = "normal",
        color: str | None = None,
        mono: bool = False,
        key: str | None = None,
    ) -> None:
        """Display text.

        Args:
            text: The text content.
            size: One of ``sm``, ``md``, ``lg``, ``xl``.
            weight: Font weight.
            color: Optional colour override.
            mono: Whether to render in a monospace font.
            key: Optional reconciliation key.
        """
        props: dict[str, Any] = {"text": text, "size": size, "weight": weight, "mono": mono}
        if color is not None:
            props["color"] = color
        super().__init__(key=key, **props)


class Markdown(Component):
    """Rendered Markdown, minus lesson directives (§6.7)."""

    type = "Markdown"

    def __init__(self, text: str, key: str | None = None) -> None:
        """Render Markdown text.

        Args:
            text: The Markdown source.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, text=text)


class Math(Component):
    """A KaTeX-rendered expression (§6.7)."""

    type = "Math"

    def __init__(self, latex: str, display: bool = False, key: str | None = None) -> None:
        """Render a LaTeX expression.

        Args:
            latex: The LaTeX source.
            display: Whether to render in display (block) mode.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, latex=latex, display=display)


class Image(Component):
    """An image (§6.7)."""

    type = "Image"

    def __init__(
        self, src: str, alt: str, width: int | None = None, key: str | None = None
    ) -> None:
        """Display an image.

        Args:
            src: Module-relative path or data URI.
            alt: Alternative text.
            width: Optional fixed width in pixels.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, src=src, alt=alt, width=width)


class Alert(Component):
    """A coloured callout box (§6.7)."""

    type = "Alert"

    def __init__(self, text: str, kind: str = "info", key: str | None = None) -> None:
        """Display an alert.

        Args:
            text: The alert text.
            kind: One of ``info``, ``success``, ``warning``, ``error``.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, text=text, kind=kind)


class Table(Component):
    """A simple data table (§6.7)."""

    type = "Table"

    def __init__(self, headers: list[str], rows: list[list], key: str | None = None) -> None:
        """Display a table.

        Args:
            headers: Column headers.
            rows: Row data; cells are str, int, or float.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, headers=headers, rows=rows)


class CodeBlock(Component):
    """A read-only highlighted code block (§6.7)."""

    type = "CodeBlock"

    def __init__(self, code: str, language: str = "python", key: str | None = None) -> None:
        """Display a code block.

        Args:
            code: The source code.
            language: The syntax-highlighting language.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, code=code, language=language)


class Badge(Component):
    """A small status pill (§6.7)."""

    type = "Badge"

    def __init__(self, text: str, kind: str = "neutral", key: str | None = None) -> None:
        """Display a badge.

        Args:
            text: The badge text.
            kind: The badge style.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, text=text, kind=kind)


class ProgressBar(Component):
    """A progress indicator (§6.7)."""

    type = "ProgressBar"

    def __init__(
        self,
        value: float,
        max: float = 1.0,
        label: str | None = None,
        key: str | None = None,
    ) -> None:
        """Display a progress bar.

        Args:
            value: Current value.
            max: Maximum value.
            label: Optional label.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, value=value, max=max, label=label)


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------


class Button(Component):
    """A clickable button (§6.7)."""

    type = "Button"

    def __init__(
        self,
        label: str,
        on_click: Callable | None = None,
        kind: str = "primary",
        disabled: bool = False,
        key: str | None = None,
    ) -> None:
        """Create a button.

        Args:
            label: Button text.
            on_click: Handler called with ``value=None`` when clicked.
            kind: One of ``primary``, ``secondary``, ``danger``, ``ghost``.
            disabled: Whether the button is disabled.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, label=label, kind=kind, disabled=disabled, on_click=on_click)


class Slider(Component):
    """A numeric slider (§6.7)."""

    type = "Slider"

    def __init__(
        self,
        label: str,
        min: float,
        max: float,
        step: float,
        value: float,
        on_change: Callable | None = None,
        show_value: bool = True,
        key: str | None = None,
    ) -> None:
        """Create a slider.

        Args:
            label: Slider label.
            min: Minimum value.
            max: Maximum value.
            step: Step increment.
            value: Current value.
            on_change: Handler called with the new ``float`` value.
            show_value: Whether to display the current value.
            key: Optional reconciliation key.
        """
        super().__init__(
            key=key,
            label=label,
            min=min,
            max=max,
            step=step,
            value=value,
            show_value=show_value,
            on_change=on_change,
        )


class NumberInput(Component):
    """A numeric text input (§6.7)."""

    type = "NumberInput"

    def __init__(
        self,
        label: str,
        value: float | None = None,
        on_change: Callable | None = None,
        min: float | None = None,
        max: float | None = None,
        step: float | None = None,
        unit: str | None = None,
        key: str | None = None,
    ) -> None:
        """Create a number input.

        Args:
            label: Input label.
            value: Current value, or ``None`` when empty.
            on_change: Handler called with the new ``float | None`` value.
            min: Optional minimum.
            max: Optional maximum.
            step: Optional step.
            unit: Optional unit suffix.
            key: Optional reconciliation key.
        """
        super().__init__(
            key=key,
            label=label,
            value=value,
            min=min,
            max=max,
            step=step,
            unit=unit,
            on_change=on_change,
        )


class TextInput(Component):
    """A text input (§6.7)."""

    type = "TextInput"

    def __init__(
        self,
        label: str,
        value: str = "",
        on_change: Callable | None = None,
        on_submit: Callable | None = None,
        placeholder: str = "",
        key: str | None = None,
    ) -> None:
        """Create a text input.

        Args:
            label: Input label.
            value: Current value.
            on_change: Handler called with the new ``str`` value.
            on_submit: Handler called with the ``str`` value on Enter.
            placeholder: Placeholder text.
            key: Optional reconciliation key.
        """
        super().__init__(
            key=key,
            label=label,
            value=value,
            placeholder=placeholder,
            on_change=on_change,
            on_submit=on_submit,
        )


class Select(Component):
    """A dropdown select (§6.7)."""

    type = "Select"

    def __init__(
        self,
        label: str,
        options: list[str],
        value: str,
        on_change: Callable | None = None,
        key: str | None = None,
    ) -> None:
        """Create a select.

        Args:
            label: Select label.
            options: The selectable options.
            value: Currently selected value.
            on_change: Handler called with the selected ``str``.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, label=label, options=options, value=value, on_change=on_change)


class RadioGroup(Component):
    """A radio-button group (§6.7)."""

    type = "RadioGroup"

    def __init__(
        self,
        label: str,
        options: list[str],
        value: int,
        on_change: Callable | None = None,
        key: str | None = None,
    ) -> None:
        """Create a radio group.

        Args:
            label: Group label.
            options: The option labels.
            value: Index of the selected option.
            on_change: Handler called with the selected ``int`` index.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, label=label, options=options, value=value, on_change=on_change)


class Checkbox(Component):
    """A single checkbox (§6.7)."""

    type = "Checkbox"

    def __init__(
        self,
        label: str,
        checked: bool,
        on_change: Callable | None = None,
        key: str | None = None,
    ) -> None:
        """Create a checkbox.

        Args:
            label: Checkbox label.
            checked: Whether the box is checked.
            on_change: Handler called with the new ``bool`` state.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, label=label, checked=checked, on_change=on_change)


class CheckboxGroup(Component):
    """A group of checkboxes (§6.7)."""

    type = "CheckboxGroup"

    def __init__(
        self,
        label: str,
        options: list[str],
        values: list[int],
        on_change: Callable | None = None,
        key: str | None = None,
    ) -> None:
        """Create a checkbox group.

        Args:
            label: Group label.
            options: The option labels.
            values: Indices of the checked options.
            on_change: Handler called with the list of checked ``int`` indices.
            key: Optional reconciliation key.
        """
        super().__init__(key=key, label=label, options=options, values=values, on_change=on_change)


# ---------------------------------------------------------------------------
# Viz
# ---------------------------------------------------------------------------


class Plot(Component):
    """A static data plot (§6.7)."""

    type = "Plot"

    def __init__(
        self,
        series: list[dict],
        x_label: str | None = None,
        y_label: str | None = None,
        height: int = 320,
        x_range: tuple | None = None,
        y_range: tuple | None = None,
        legend: bool = True,
        key: str | None = None,
    ) -> None:
        """Create a data plot.

        Args:
            series: ``[{"name", "points": [[x, y], ...], "kind"}]`` entries.
            x_label: Optional x-axis label.
            y_label: Optional y-axis label.
            height: Plot height in pixels.
            x_range: Optional ``(lo, hi)`` x-range.
            y_range: Optional ``(lo, hi)`` y-range.
            legend: Whether to show the legend.
            key: Optional reconciliation key.
        """
        super().__init__(
            key=key,
            series=series,
            x_label=x_label,
            y_label=y_label,
            height=height,
            x_range=x_range,
            y_range=y_range,
            legend=legend,
        )


class FunctionPlot(Plot):
    """A plot of Python functions, sampled at render time (§6.7).

    Each entry in ``fns`` is ``{"name": str, "expr": callable}``. The callables
    are evaluated in Python over ``samples`` points across ``x_range`` and the
    result is emitted as an ordinary ``Plot`` node, so no expression strings
    cross the host boundary.
    """

    type = "Plot"

    def __init__(
        self,
        fns: list[dict],
        x_range: tuple = (-10, 10),
        samples: int = 200,
        x_label: str | None = None,
        y_label: str | None = None,
        height: int = 320,
        y_range: tuple | None = None,
        legend: bool = True,
        key: str | None = None,
    ) -> None:
        """Create a function plot.

        Args:
            fns: ``[{"name": str, "expr": callable}]`` entries to sample.
            x_range: ``(lo, hi)`` sampling range.
            samples: Number of sample points per function.
            x_label: Optional x-axis label.
            y_label: Optional y-axis label.
            height: Plot height in pixels.
            y_range: Optional ``(lo, hi)`` y-range.
            legend: Whether to show the legend.
            key: Optional reconciliation key.
        """
        series = [
            {"name": fn["name"], "points": _sample(fn["expr"], x_range, samples), "kind": "line"}
            for fn in fns
        ]
        super().__init__(
            series,
            x_label=x_label,
            y_label=y_label,
            height=height,
            x_range=x_range,
            y_range=y_range,
            legend=legend,
            key=key,
        )


def _sample(expr: Callable, x_range: tuple, samples: int) -> list[list[float]]:
    """Sample ``expr`` over ``x_range`` into ``[x, y]`` pairs."""
    lo, hi = x_range
    n = max(samples, 2)
    step = (hi - lo) / (n - 1)
    points: list[list[float]] = []
    for i in range(n):
        x = lo + i * step
        points.append([x, expr(x)])
    return points


class Canvas(Component):
    """An immediate-mode 2D canvas (§6.7)."""

    type = "Canvas"

    def __init__(
        self,
        width: int,
        height: int,
        commands: list[dict],
        on_pointer: Callable | None = None,
        background: str = "#0b1220",
        key: str | None = None,
    ) -> None:
        """Create a canvas.

        Args:
            width: Canvas width in pixels.
            height: Canvas height in pixels.
            commands: Draw commands from :mod:`learnsdk.draw`.
            on_pointer: Handler for ``{type, x, y}`` pointer events.
            background: Background colour.
            key: Optional reconciliation key.
        """
        super().__init__(
            key=key,
            width=width,
            height=height,
            background=background,
            on_pointer=on_pointer,
            commands=commands,
        )
