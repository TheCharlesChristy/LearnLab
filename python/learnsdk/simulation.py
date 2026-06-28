"""Tick-driven simulations in pure Python (SRS §6.8).

:class:`SimulationItem` presets ``wants_tick`` and provides a small transport
(running flag, accumulated ``sim_time``, and Play/Pause/Reset helpers wired into
a standard :meth:`SimulationItem.transport` row). Authors implement
:meth:`~learnsdk.LearningItem.tick` and :meth:`~learnsdk.LearningItem.render`.
"""

from __future__ import annotations

from .components import Button, Row
from .item import LearningItem


class SimulationItem(LearningItem):
    """A time-stepped simulation base class (§6.8).

    Sets ``wants_tick = True`` and exposes :attr:`running` and :attr:`sim_time`
    plus the :meth:`start`, :meth:`pause` and :meth:`reset_sim` helpers and a
    ready-made :meth:`transport` row. The framework only delivers ticks while
    the item is visible; authors gate physics on :attr:`running` themselves (the
    reference projectile item only accumulates while started).

    Attributes:
        running: Whether the simulation is currently advancing.
        sim_time: Accumulated simulation time in seconds.
    """

    wants_tick: bool = True

    running: bool
    sim_time: float

    def _framework_init(self, **kwargs: object) -> None:
        """Seed transport defaults before author :meth:`setup` runs.

        Args:
            **kwargs: Forwarded to :meth:`LearningItem._framework_init`.
        """
        super()._framework_init(**kwargs)  # type: ignore[arg-type]
        self.running = False
        self.sim_time = 0.0

    def start(self, _value: object = None) -> None:
        """Begin (or resume) advancing the simulation.

        Args:
            _value: Ignored event value (so it can wire directly to a button).
        """
        self.running = True

    def pause(self, _value: object = None) -> None:
        """Pause the simulation, keeping :attr:`sim_time`.

        Args:
            _value: Ignored event value.
        """
        self.running = False

    def reset_sim(self, _value: object = None) -> None:
        """Stop and reset :attr:`sim_time` to zero.

        Args:
            _value: Ignored event value.
        """
        self.running = False
        self.sim_time = 0.0

    def transport(self) -> Row:
        """Return a standard Play/Pause/Reset transport row (§6.8).

        Returns:
            A :class:`~learnsdk.components.Row` of transport buttons wired to
            :meth:`start`, :meth:`pause` and :meth:`reset_sim`.
        """
        return Row(
            Button("Play", on_click=self.start, key="play"),
            Button("Pause", on_click=self.pause, kind="secondary", key="pause"),
            Button("Reset", on_click=self.reset_sim, kind="ghost", key="reset"),
            key="transport",
        )
