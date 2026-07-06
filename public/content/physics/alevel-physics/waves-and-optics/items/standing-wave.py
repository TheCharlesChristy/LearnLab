"""Standing wave visualiser.

Draws the envelope of a standing wave on a string fixed at both ends for a
chosen harmonic number n. Nodes (red) and antinodes are shown so learners can
connect the algebraic relationship L = n * lambda / 2 to the picture.
"""

import math

from learnsdk import Canvas, Column, LearningItem, Slider, Text, draw

W, H = 640, 260
MARGIN = 24
AMPLITUDE = 90  # px, envelope half-height on screen


class Item(LearningItem):
    title = "Standing waves on a string"

    def setup(self):
        saved = self.saved_state or {}
        self.harmonic = int(saved.get("harmonic", self.params.get("harmonic", 1)))

    def get_state(self):
        return {"_v": 1, "harmonic": self.harmonic}

    def set_harmonic(self, value):
        self.harmonic = int(round(value))

    def render(self):
        n = self.harmonic
        span = W - 2 * MARGIN
        mid_y = H / 2

        cmds = [draw.clear("#0b1220"), draw.grid(40)]
        cmds.append(draw.line(MARGIN, mid_y, W - MARGIN, mid_y, "#334155", 1))

        # Envelope of the standing wave: y = A * sin(n * pi * x / L)
        steps = 200
        prev = None
        for i in range(steps + 1):
            frac = i / steps
            x = MARGIN + span * frac
            y = mid_y - AMPLITUDE * math.sin(n * math.pi * frac)
            if prev is not None:
                cmds.append(draw.line(prev[0], prev[1], x, y, "#7dd3fc", 2))
            prev = (x, y)

        # Nodes at x = k/n along the string (k = 0..n), including both fixed ends.
        for k in range(n + 1):
            x = MARGIN + span * (k / n)
            cmds.append(draw.circle(x, mid_y, 5, fill="#f87171"))

        return Column(
            Slider(
                "Harmonic number n",
                1,
                5,
                1,
                self.harmonic,
                on_change=self.set_harmonic,
            ),
            Canvas(W, H, cmds),
            Text(
                f"n = {n}: {n} antinode(s), {n + 1} node(s) "
                f"(including the two fixed ends). L = {n} x lambda/2.",
                mono=True,
            ),
            gap=3,
        )
