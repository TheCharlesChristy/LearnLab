# Potential divider explorer (plain LearningItem, SRS §6.6/§6.7).
# Two resistors R1, R2 in series across a supply Vin; the output is tapped
# across R2: Vout = Vin * R2 / (R1 + R2). Sliders let the learner vary all
# three quantities; a Canvas sketches the divider circuit and labels the
# tapped node with the live Vout reading, and NumberInput shows the current
# drawn from the supply (I = Vin / (R1 + R2)).
from learnsdk import Canvas, Column, LearningItem, NumberInput, Row, Slider, Text, draw

W, H = 420, 220


class Item(LearningItem):
    title = "Potential divider explorer"

    def setup(self):
        s = self.saved_state or {}
        self.vin = s.get("vin", self.params.get("vin", 12.0))
        self.r1 = s.get("r1", self.params.get("r1", 8.0))
        self.r2 = s.get("r2", self.params.get("r2", 4.0))

    def get_state(self):
        return {"_v": 1, "vin": self.vin, "r1": self.r1, "r2": self.r2}

    def _set_vin(self, v):
        self.vin = v
        self.persist()

    def _set_r1(self, v):
        self.r1 = v
        self.persist()

    def _set_r2(self, v):
        self.r2 = v
        self.persist()

    def render(self):
        r_total = self.r1 + self.r2
        current = self.vin / r_total
        vout = self.vin * self.r2 / r_total

        cmds = [
            draw.clear("#0b1220"),
            # Left rail: battery symbol (two parallel bars).
            draw.line(40, 40, 40, 180, "#94a3b8", 2),
            draw.line(30, 70, 50, 70, "#e2e8f0", 4),
            draw.line(34, 90, 46, 90, "#e2e8f0", 2),
            # Top wire from battery to R1.
            draw.line(40, 40, 200, 40, "#94a3b8", 2),
            # R1 (top resistor box).
            draw.rect(170, 40, 60, 40, fill="#1e293b", stroke="#7dd3fc", width=2),
            draw.text(200, 65, "R1", color="#7dd3fc", size=13, align="center"),
            # Wire from R1 down to the tap node.
            draw.line(200, 80, 200, 110, "#94a3b8", 2),
            draw.circle(200, 110, 4, fill="#facc15"),
            # Tap wire out to the Vout label.
            draw.line(200, 110, 340, 110, "#facc15", 2),
            draw.text(350, 114, f"Vout = {vout:.2f} V", color="#facc15", size=13, align="left"),
            # R2 (bottom resistor box), from the tap node down to the bottom rail.
            draw.line(200, 110, 200, 140, "#94a3b8", 2),
            draw.rect(170, 140, 60, 40, fill="#1e293b", stroke="#7dd3fc", width=2),
            draw.text(200, 165, "R2", color="#7dd3fc", size=13, align="center"),
            draw.line(200, 180, 200, 180, "#94a3b8", 2),
            # Bottom wire back to the battery.
            draw.line(40, 180, 200, 180, "#94a3b8", 2),
            draw.text(40, 30, f"Vin = {self.vin:.1f} V", color="#e2e8f0", size=12, align="center"),
        ]

        return Column(
            Canvas(W, H, cmds),
            Row(
                Slider("Vin (V)", 1.0, 20.0, 0.5, self.vin, on_change=self._set_vin),
                Slider("R1 (kΩ)", 0.5, 20.0, 0.5, self.r1, on_change=self._set_r1),
                Slider("R2 (kΩ)", 0.5, 20.0, 0.5, self.r2, on_change=self._set_r2),
            ),
            Row(
                NumberInput("Total resistance (kΩ)", value=round(r_total, 2)),
                NumberInput("Current (mA)", value=round(current, 3)),
                NumberInput("Vout (V)", value=round(vout, 3)),
            ),
            Text(
                "Vout = Vin × R2 / (R1 + R2). Try making R2 much smaller than R1 "
                "(Vout falls towards 0 V) or much larger (Vout rises towards Vin).",
                size="sm",
            ),
        )
