"""Worker-side bridge: the Python end of the host<->worker protocol.

This private module (D-exempt, §6.5) is what ``worker.ts`` drives. The worker
calls :func:`init` once with a JS poster, then routes every incoming envelope
through :func:`dispatch`. The bridge owns item construction (§6.2.3), the render
loop and serialisation (§6.4), and the snippet sandbox (§6.12), replying with
the §6.3 message envelopes.

Calling convention (matches worker.ts / T1.1):
    * ``init(js_post)`` — ``js_post`` is a callable taking one JSON-safe dict
      (the envelope). The worker passes a function that ``self.postMessage``-es
      it. ``INIT``/``READY`` are handled in worker.ts; the bridge only needs the
      poster.
    * ``dispatch(envelope)`` — ``envelope`` is a JSON string or a dict. The
      bridge handles LOAD_ITEM / EVENT / TICK / SERIALIZE_STATE /
      DESTROY_ITEM / RUN_SNIPPET / SHUTDOWN and posts replies via ``js_post``.
      Unknown type -> ERROR{code:'unknown-type'}.
"""

from __future__ import annotations

import contextlib
import io
import json
import sys
import traceback
import types
import uuid
from collections.abc import Callable
from typing import Any

from .components import Component
from .item import LearningItem

PROTOCOL_VERSION = 1
SDK_VERSION = "1.0.0"

TREE_SOFT_CAP = 2000
TREE_HARD_CAP = 5000


class SerializationError(Exception):
    """Raised when a component prop value is not JSON-safe (§6.4 rule 4).

    The message names the offending prop and its path in the tree so the author
    can find it. This is part of the public surface so items can catch it.
    """


# ---------------------------------------------------------------------------
# Module state
# ---------------------------------------------------------------------------

_js_post: Callable[[dict], None] | None = None
_items: dict[str, _LoadedItem] = {}


def init(js_post: Callable[[dict], None]) -> None:
    """Register the JS poster the bridge uses to reach the host.

    Args:
        js_post: A callable taking one JSON-safe envelope dict.
    """
    global _js_post
    _js_post = js_post
    _items.clear()


def _post(envelope: dict) -> None:
    if _js_post is None:
        raise RuntimeError("bridge.init(js_post) was not called")
    _js_post(envelope)


def _envelope(type_: str, payload: dict, reply_to: str | None = None) -> dict:
    env: dict[str, Any] = {
        "v": PROTOCOL_VERSION,
        "id": str(uuid.uuid4()),
        "type": type_,
        "payload": payload,
    }
    if reply_to is not None:
        env["replyTo"] = reply_to
    return env


# ---------------------------------------------------------------------------
# Per-item runtime (backs LearningItem services)
# ---------------------------------------------------------------------------


class _LoadedItem:
    """Tracks one live item: its instance, render seq and handler-token map."""

    def __init__(self, item: LearningItem, item_id: str) -> None:
        self.item = item
        self.item_id = item_id
        self.seq = 0
        self.handlers: dict[str, Callable] = {}
        self._warned_node_cap = False

    # ---- services called by LearningItem ----

    def request_render(self, item: LearningItem) -> None:
        self._render_and_post()

    def persist(self, item: LearningItem) -> None:
        state = item.get_state()
        _post(_envelope("PERSIST", {"itemId": self.item_id, "state": state}))

    def complete(self, item: LearningItem, score: float | None, max_score: float | None) -> None:
        if score is None:
            payload: dict[str, Any] = {"itemId": self.item_id, "kind": "completed"}
        else:
            payload = {"itemId": self.item_id, "kind": "scored", "score": score}
            if max_score is not None:
                payload["maxScore"] = max_score
        _post(_envelope("PROGRESS", payload))

    def log(self, item: LearningItem, text: str) -> None:
        _post(_envelope("LOG", {"itemId": self.item_id, "level": "info", "text": text}))

    def debug(self, text: str) -> None:
        _post(_envelope("LOG", {"itemId": self.item_id, "level": "debug", "text": text}))

    def warn(self, text: str) -> None:
        _post(_envelope("LOG", {"itemId": self.item_id, "level": "warn", "text": text}))

    # ---- render loop ----

    def render_tree(self) -> dict:
        """Render the item and serialise to a JSON node, refreshing handlers."""
        component = self.item.render()
        self.handlers = {}
        counter = _Counter()
        nodes = _NodeCount()
        tree = serialise(component, self.handlers, counter, nodes, runtime=self)
        if nodes.value > TREE_HARD_CAP:
            raise SerializationError(
                f"component tree has {nodes.value} nodes (> {TREE_HARD_CAP} hard cap)"
            )
        if nodes.value > TREE_SOFT_CAP and not self._warned_node_cap:
            self._warned_node_cap = True
            self.warn(f"component tree has {nodes.value} nodes (> {TREE_SOFT_CAP} soft cap)")
        return tree

    def _render_and_post(self) -> None:
        tree = self.render_tree()
        self.seq += 1
        _post(_envelope("RENDER", {"itemId": self.item_id, "seq": self.seq, "tree": tree}))


class _Counter:
    """A mutable counter producing deterministic handler tokens h0, h1, ..."""

    def __init__(self) -> None:
        self.n = 0

    def next(self) -> str:
        token = f"h{self.n}"
        self.n += 1
        return token


class _NodeCount:
    def __init__(self) -> None:
        self.value = 0


_EVENT_PROPS = ("on_click", "on_change", "on_submit", "on_pointer")


# ---------------------------------------------------------------------------
# Serialisation (§6.4)
# ---------------------------------------------------------------------------


def serialise(
    component: Component,
    handlers: dict[str, Callable],
    counter: _Counter,
    nodes: _NodeCount,
    *,
    runtime: _LoadedItem | None = None,
    path: str = "root",
) -> dict:
    """Serialise a component subtree into a JSON node (§6.4).

    Callable props become ``{"__h": token}`` with deterministic tokens assigned
    h0, h1, ... in depth-first document order; the ``token -> callable`` map is
    written into ``handlers``. ``key`` defaults to the position path, author
    ``key=`` wins. numpy scalars/arrays are auto-converted. Non-JSON-safe values
    raise :class:`SerializationError` naming the prop and path.

    Args:
        component: The component to serialise.
        handlers: The token->callable map to populate.
        counter: Token counter (reset once per render).
        nodes: Node count accumulator.
        runtime: Owning item runtime (unused directly; reserved).
        path: Position path for default keys and error messages.

    Returns:
        A ``{type, key, props, children}`` node.
    """
    if not isinstance(component, Component):
        raise SerializationError(f"expected a Component at {path}, got {type(component).__name__}")

    nodes.value += 1
    key = component.key if component.key is not None else path.split(".")[-1]

    props: dict[str, Any] = {}
    for name, value in component.props.items():
        if name in _EVENT_PROPS or callable(value):
            if value is None:
                continue
            if callable(value):
                token = counter.next()
                handlers[token] = value
                props[name] = {"__h": token}
                continue
        props[name] = _json_safe(value, f"{path}.props.{name}")

    children = []
    for i, child in enumerate(component.children):
        children.append(
            serialise(child, handlers, counter, nodes, runtime=runtime, path=f"{path}.{i}")
        )

    return {
        "type": component.type,
        "key": str(key),
        "props": props,
        "children": children,
    }


def _json_safe(value: Any, path: str) -> Any:
    """Coerce ``value`` to a JSON-safe value or raise SerializationError."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value

    # numpy scalars/arrays — guarded import, only if numpy present.
    converted = _maybe_numpy(value)
    if converted is not None:
        return _json_safe(converted, path)

    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for k, v in value.items():
            if not isinstance(k, str):
                raise SerializationError(f"non-string dict key at {path}: {k!r}")
            out[k] = _json_safe(v, f"{path}.{k}")
        return out

    if isinstance(value, (list, tuple)):
        return [_json_safe(v, f"{path}[{i}]") for i, v in enumerate(value)]

    raise SerializationError(f"prop value at {path} is not JSON-safe: {type(value).__name__}")


def _maybe_numpy(value: Any) -> Any:
    """Return a JSON-safe form if ``value`` is a numpy scalar/array, else None."""
    try:
        import numpy as np  # noqa: PLC0415 - guarded lazy import (§6.11)
    except Exception:
        return None
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, np.ndarray):
        return value.tolist()
    return None


# ---------------------------------------------------------------------------
# Load (§6.2.3)
# ---------------------------------------------------------------------------


def _build_namespace(item_id: str) -> types.ModuleType:
    """Create a fresh module namespace so item code can import learnsdk."""
    ns = types.ModuleType(f"item_{item_id}")
    import learnsdk  # noqa: PLC0415

    ns.__dict__["learnsdk"] = learnsdk
    try:
        import courselib  # noqa: PLC0415

        ns.__dict__["courselib"] = courselib
    except Exception:
        pass
    return ns


def _load_item(payload: dict, reply_to: str | None) -> None:
    item_id = payload["itemId"]
    source = payload["source"]
    source_url = payload.get("sourceUrl", f"{item_id}.py")
    params = payload.get("params") or {}
    saved_state = payload.get("savedState")
    seed = payload.get("seed", 0)

    try:
        ns = _build_namespace(item_id)
        code = compile(source, source_url, "exec")
        exec(code, ns.__dict__)  # noqa: S102 - author content runs in the worker sandbox
    except Exception:
        _post_error(item_id, "load", *_format_exc())
        return

    item_cls = ns.__dict__.get("Item")
    if item_cls is None:
        _post_error(item_id, "load", "the item file must define a class named 'Item'", "")
        return
    if not (isinstance(item_cls, type) and issubclass(item_cls, LearningItem)):
        _post_error(item_id, "load", "'Item' must subclass learnsdk.LearningItem", "")
        return
    if "__init__" in item_cls.__dict__:
        msg = (
            "items must not define __init__ — the framework owns construction "
            "(§6.6). Move setup logic into setup(), which runs after params, "
            "saved_state, rng and item_id are injected."
        )
        _post_error(item_id, "load", msg, "")
        return

    try:
        instance = item_cls.__new__(item_cls)
        loaded = _LoadedItem(instance, item_id)
        instance._framework_init(
            item_id=item_id,
            params=params,
            saved_state=saved_state,
            seed=seed,
            runtime=loaded,
        )
        instance.setup()
        tree = loaded.render_tree()
    except Exception:
        _post_error(item_id, "load", *_format_exc())
        return

    _items[item_id] = loaded

    meta: dict[str, Any] = {"wantsTick": bool(instance.wants_tick)}
    if instance.title is not None:
        meta["title"] = instance.title
    if instance.wants_tick:
        meta["tickHz"] = int(instance.tick_hz)
    _post(_envelope("LOADED", {"itemId": item_id, "meta": meta}, reply_to=reply_to))

    loaded.seq += 1
    _post(_envelope("RENDER", {"itemId": item_id, "seq": loaded.seq, "tree": tree}))


# ---------------------------------------------------------------------------
# Event / tick / state (§6.4 re-render policy)
# ---------------------------------------------------------------------------


def _event(payload: dict) -> None:
    item_id = payload["itemId"]
    token = payload["handler"]
    value = payload.get("value")
    loaded = _items.get(item_id)
    if loaded is None:
        return
    handler = loaded.handlers.get(token)
    if handler is None:
        loaded.debug(f"stale handler token ignored: {token}")
        return
    try:
        handler(value)
    except Exception:
        _post_error(item_id, "event", *_format_exc())
        return  # skip the re-render (§6.4)
    try:
        loaded._render_and_post()
    except Exception:
        _post_error(item_id, "event", *_format_exc())


def _tick(payload: dict) -> None:
    item_id = payload["itemId"]
    dt = payload.get("dt", 0.0)
    loaded = _items.get(item_id)
    if loaded is None or not loaded.item.wants_tick:
        return
    try:
        loaded.item.tick(dt)
        loaded._render_and_post()
    except Exception:
        _post_error(item_id, "tick", *_format_exc())


def _serialize_state(payload: dict) -> None:
    item_id = payload["itemId"]
    loaded = _items.get(item_id)
    if loaded is None:
        return
    _post(_envelope("STATE", {"itemId": item_id, "state": loaded.item.get_state()}))


def _destroy_item(payload: dict) -> None:
    item_id = payload["itemId"]
    _items.pop(item_id, None)
    _post(_envelope("DESTROYED", {"itemId": item_id}))


def _run_snippet(payload: dict) -> None:
    run_id = payload["runId"]
    code = payload["code"]
    out = io.StringIO()
    err = io.StringIO()
    result: dict[str, Any] = {"runId": run_id, "ok": True, "stdout": "", "stderr": ""}
    try:
        ns: dict[str, Any] = {"__name__": "__snippet__"}
        compiled = compile(code, f"<snippet:{run_id}>", "exec")
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            exec(compiled, ns)  # noqa: S102 - isolated snippet sandbox (§6.12, C-6)
    except Exception:
        result["ok"] = False
        result["error"] = traceback.format_exc()
    result["stdout"] = out.getvalue()
    result["stderr"] = err.getvalue()
    _post(_envelope("SNIPPET_RESULT", result))


# ---------------------------------------------------------------------------
# Errors / dispatch
# ---------------------------------------------------------------------------


def _format_exc() -> tuple[str, str]:
    """Return ``(message, traceback)`` for the current exception."""
    tb = traceback.format_exc()
    exc = traceback.format_exception_only(*sys.exc_info()[:2])
    message = "".join(exc).strip()
    return message, tb


def _post_error(
    item_id: str | None,
    phase: str,
    message: str,
    tb: str,
    code: str | None = None,
) -> None:
    payload: dict[str, Any] = {"phase": phase, "message": message, "traceback": tb}
    if item_id is not None:
        payload["itemId"] = item_id
    if code is not None:
        payload["code"] = code
    _post(_envelope("ERROR", payload))


def dispatch(envelope: Any) -> None:
    """Route one incoming host envelope to its handler (§6.3).

    Args:
        envelope: A JSON string or an already-parsed envelope dict.
    """
    if isinstance(envelope, (str, bytes, bytearray)):
        envelope = json.loads(envelope)

    type_ = envelope.get("type")
    payload = envelope.get("payload") or {}
    reply_to = envelope.get("id")

    if type_ == "LOAD_ITEM":
        _load_item(payload, reply_to)
    elif type_ == "EVENT":
        _event(payload)
    elif type_ == "TICK":
        _tick(payload)
    elif type_ == "SERIALIZE_STATE":
        _serialize_state(payload)
    elif type_ == "DESTROY_ITEM":
        _destroy_item(payload)
    elif type_ == "RUN_SNIPPET":
        _run_snippet(payload)
    elif type_ == "SHUTDOWN":
        _items.clear()
    else:
        _post_error(None, "boot", f"unknown message type: {type_!r}", "", code="unknown-type")
