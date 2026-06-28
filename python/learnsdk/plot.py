"""Parameter-exploration plots in pure Python (SRS §6.8).

:class:`PlotExplorerItem` turns a function plus a list of :class:`Ctl` sliders
into an interactive explorer with almost no author code: the base renders one
slider per control and a live :class:`~learnsdk.components.FunctionPlot` of
``self.f(x, **controls)`` over ``self.x_range``.
"""

from __future__ import annotations

from dataclasses import dataclass

from .components import Column, FunctionPlot, Slider, Text
from .item import LearningItem


@dataclass
class Ctl:
    """One slider control for a :class:`PlotExplorerItem` (§6.8).

    Attributes:
        key: The keyword name passed to ``f`` and used as state key.
        label: The slider label shown to the learner.
        min: Minimum slider value.
        max: Maximum slider value.
        step: Slider step increment.
        default: The initial value.
    """

    key: str
    label: str
    min: float
    max: float
    step: float
    default: float


class PlotExplorerItem(LearningItem):
    """A near-zero-code parameter-exploration plot (§6.8).

    Authors set :attr:`controls` (a list of :class:`Ctl`), :attr:`x_range`, and
    define ``f(self, x, **controls)``. The base renders a slider per control and
    a live :class:`~learnsdk.components.FunctionPlot` that re-samples ``f`` with
    the current control values on every change.

    Attributes:
        controls: The slider controls defining the explorable parameters.
        x_range: The ``(lo, hi)`` x-range to plot over.
        samples: Number of sample points across :attr:`x_range`.
    """

    controls: list[Ctl] = []  # noqa: RUF012 - author-set class config
    x_range: tuple[float, float] = (-10.0, 10.0)
    samples: int = 200

    def f(self, x: float, **controls: float) -> float:
        """Evaluate the plotted function at ``x`` (REQUIRED override).

        Args:
            x: The x value to evaluate at.
            **controls: The current value of each :class:`Ctl`, keyed by
                ``Ctl.key``.

        Returns:
            The function value ``y``.

        Raises:
            NotImplementedError: If the author does not override it.
        """
        raise NotImplementedError("PlotExplorerItem subclasses must define f()")

    def setup(self) -> None:
        """Initialise control values from defaults (or restored state)."""
        saved = (self.saved_state or {}).get("values", {})
        self.values: dict[str, float] = {c.key: saved.get(c.key, c.default) for c in self.controls}

    def get_state(self) -> dict:
        """Persist the current control values.

        Returns:
            The JSON-safe state.
        """
        return {"_v": 1, "values": dict(self.values)}

    def _setter(self, key: str):
        """Return an ``on_change`` handler that updates control ``key``."""

        def handler(value: float) -> None:
            self.values[key] = value

        return handler

    def render(self) -> Column:
        """Render the control sliders and the live function plot (§6.8).

        Returns:
            The component tree.
        """
        sliders = [
            Slider(
                c.label,
                c.min,
                c.max,
                c.step,
                self.values[c.key],
                on_change=self._setter(c.key),
                key=f"ctl-{c.key}",
            )
            for c in self.controls
        ]
        plot = FunctionPlot(
            [{"name": "f(x)", "expr": lambda x: self.f(x, **self.values)}],
            x_range=self.x_range,
            samples=self.samples,
            key="plot",
        )
        children: list = []
        if self.title is not None:
            children.append(Text(self.title, size="lg", weight="bold"))
        children.extend(sliders)
        children.append(plot)
        return Column(*children, gap=3, key="root")
