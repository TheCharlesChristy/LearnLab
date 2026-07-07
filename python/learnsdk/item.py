"""``LearningItem`` — the core item base class (SRS §6.6, normative).

An item author writes a single ``.py`` file defining ``class Item`` that
subclasses :class:`LearningItem`, overrides the lifecycle hooks, and calls the
provided services. The framework owns construction and the render loop; authors
never touch React, TypeScript, or the worker protocol.
"""

from __future__ import annotations

import random
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .components import Component


class LearningItem:
    """Base class for all interactive learning items (§6.6).

    Authors subclass this as ``Item``, set the class-level configuration,
    override the lifecycle hooks (:meth:`setup`, :meth:`render`, and optionally
    :meth:`tick` and :meth:`get_state`), and call the services (:meth:`update`,
    :meth:`persist`, :meth:`complete`, :meth:`log`). The framework injects
    ``params``, ``saved_state``, ``rng`` and ``item_id`` before :meth:`setup`
    runs; authors MUST NOT define ``__init__`` (validated at load).

    Attributes:
        title: Optional display title shown above the item.
        requires: Pyodide packages to load before the item runs.
        wants_tick: Whether the framework should drive :meth:`tick`.
        tick_hz: Desired tick rate; the host clamps to ``[1, 60]``.
        params: Author parameters from the lesson, ``{}`` if absent.
        saved_state: Last persisted state, ``None`` on first run.
        rng: Seeded generator; the only sanctioned randomness source.
        item_id: The unique id of this item instance.
    """

    # ---- class-level configuration (author-set) ----
    title: str | None = None
    requires: list[str] = []  # noqa: RUF012 - author-set class config, simple list
    wants_tick: bool = False
    tick_hz: int = 30

    # ---- framework-injected attributes ----
    params: dict
    saved_state: dict | None
    rng: random.Random
    item_id: str

    def _framework_init(
        self,
        *,
        item_id: str,
        params: dict,
        saved_state: dict | None,
        seed: int,
        runtime: Any,
    ) -> None:
        """Inject framework-owned state. Called by the bridge, never by authors.

        Args:
            item_id: The item instance id.
            params: Author parameters.
            saved_state: Previously persisted state, or ``None``.
            seed: Seed for the deterministic per-attempt generator.
            runtime: The bridge runtime backing the item services.
        """
        self.item_id = item_id
        self.params = params
        self.saved_state = saved_state
        self.rng = random.Random(seed)
        self._runtime = runtime
        self._completed = False

    # ---- lifecycle hooks: authors override these ----

    def setup(self) -> None:
        """Build initial state, restoring from ``saved_state`` when present.

        The default does nothing. Override to initialise state; when
        ``self.saved_state`` is not ``None`` you SHOULD restore from it.
        """

    def render(self) -> Component:
        """Return the component tree for the current state (REQUIRED).

        Must be a pure function of item state and must not mutate it.

        Returns:
            The root :class:`~learnsdk.components.Component`.

        Raises:
            NotImplementedError: If the author does not override it.
        """
        raise NotImplementedError("LearningItem subclasses must override render()")

    def tick(self, dt: float) -> None:
        """Advance time by ``dt`` seconds (only called if ``wants_tick``).

        Args:
            dt: Elapsed time since the previous tick, in seconds.
        """

    def get_state(self) -> dict:
        """Return the JSON-safe state to persist.

        Returns:
            A JSON-safe dict; ``{}`` by default (nothing persisted).
        """
        return {}

    # ---- services: authors call these ----

    def update(self) -> None:
        """Request a re-render outside the automatic event/tick re-renders.

        Rarely needed: the framework already re-renders after each handler and
        each :meth:`tick`.
        """
        self._runtime.request_render(self)

    def persist(self) -> None:
        """Snapshot :meth:`get_state` and emit a ``PERSIST`` message."""
        self._runtime.persist(self)

    def complete(self, score: float | None = None, max_score: float | None = None) -> None:
        """Report completion or a score (§6.6, idempotent per attempt).

        Emits a ``PROGRESS`` message: ``'scored'`` when ``score`` is given,
        otherwise ``'completed'``. Repeat calls within an attempt are ignored
        with a debug log.

        Args:
            score: The achieved score, or ``None`` for plain completion.
            max_score: The maximum possible score, if scored.
        """
        if self._completed:
            self._runtime.debug(f"complete() ignored (already completed) for {self.item_id}")
            return
        self._completed = True
        self._runtime.complete(self, score=score, max_score=max_score)

    def log(self, *args: Any) -> None:
        """Emit an info-level log line to the host console.

        Args:
            *args: Values joined with spaces, like ``print``.
        """
        self._runtime.log(self, " ".join(str(a) for a in args))
