"""Canvas draw-command constructors (SRS §6.7 ``learnsdk.draw``).

Each function returns a JSON-safe ``{"op": ..., ...}`` dict for one of the
eight immediate-mode 2D operations the host implements. Pass a list of these
as the ``commands`` of a :class:`~learnsdk.components.Canvas`. The coordinate
origin is top-left, y-down, in CSS pixels.
"""

from __future__ import annotations


def clear(color: str) -> dict:
    """Fill the whole canvas with a solid colour.

    Args:
        color: CSS colour string.

    Returns:
        A ``clear`` draw command.
    """
    return {"op": "clear", "color": color}


def line(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: str = "#e2e8f0",
    width: float = 1,
) -> dict:
    """Draw a straight line from ``(x1, y1)`` to ``(x2, y2)``.

    Args:
        x1: Start x.
        y1: Start y.
        x2: End x.
        y2: End y.
        color: Stroke colour.
        width: Stroke width in pixels.

    Returns:
        A ``line`` draw command.
    """
    return {"op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "color": color, "width": width}


def circle(
    x: float,
    y: float,
    r: float,
    fill: str | None = None,
    stroke: str | None = None,
    width: float = 1,
) -> dict:
    """Draw a circle centred at ``(x, y)``.

    Args:
        x: Centre x.
        y: Centre y.
        r: Radius.
        fill: Fill colour, or ``None`` for no fill.
        stroke: Stroke colour, or ``None`` for no stroke.
        width: Stroke width in pixels.

    Returns:
        A ``circle`` draw command.
    """
    return {"op": "circle", "x": x, "y": y, "r": r, "fill": fill, "stroke": stroke, "width": width}


def rect(
    x: float,
    y: float,
    w: float,
    h: float,
    fill: str | None = None,
    stroke: str | None = None,
    width: float = 1,
) -> dict:
    """Draw an axis-aligned rectangle.

    Args:
        x: Top-left x.
        y: Top-left y.
        w: Width.
        h: Height.
        fill: Fill colour, or ``None`` for no fill.
        stroke: Stroke colour, or ``None`` for no stroke.
        width: Stroke width in pixels.

    Returns:
        A ``rect`` draw command.
    """
    return {
        "op": "rect",
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "fill": fill,
        "stroke": stroke,
        "width": width,
    }


def polygon(
    points: list,
    fill: str | None = None,
    stroke: str | None = None,
    width: float = 1,
) -> dict:
    """Draw a closed polygon through ``points``.

    Args:
        points: A list of ``[x, y]`` vertex pairs.
        fill: Fill colour, or ``None`` for no fill.
        stroke: Stroke colour, or ``None`` for no stroke.
        width: Stroke width in pixels.

    Returns:
        A ``polygon`` draw command.
    """
    return {"op": "polygon", "points": points, "fill": fill, "stroke": stroke, "width": width}


def text(
    x: float,
    y: float,
    s: str,
    color: str = "#e2e8f0",
    size: float = 12,
    align: str = "left",
) -> dict:
    """Draw a text string at ``(x, y)``.

    Args:
        x: Anchor x.
        y: Anchor y (baseline).
        s: The string to draw.
        color: Text colour.
        size: Font size in pixels.
        align: Horizontal alignment (``"left"``, ``"center"``, ``"right"``).

    Returns:
        A ``text`` draw command.
    """
    return {"op": "text", "x": x, "y": y, "s": s, "color": color, "size": size, "align": align}


def arrow(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: str = "#e2e8f0",
    width: float = 2,
) -> dict:
    """Draw an arrow (line plus head) from ``(x1, y1)`` to ``(x2, y2)``.

    Args:
        x1: Tail x.
        y1: Tail y.
        x2: Head x.
        y2: Head y.
        color: Stroke colour.
        width: Stroke width in pixels.

    Returns:
        An ``arrow`` draw command.
    """
    return {"op": "arrow", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "color": color, "width": width}


def grid(spacing: float, color: str = "#1e293b") -> dict:
    """Draw a background grid.

    Args:
        spacing: Grid line spacing in pixels.
        color: Grid line colour.

    Returns:
        A ``grid`` draw command.
    """
    return {"op": "grid", "spacing": spacing, "color": color}
