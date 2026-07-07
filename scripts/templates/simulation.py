import math
from learnsdk import (SimulationItem, Column, Row, Slider, Button,
                      Canvas, Text, draw)
from courselib.physics import G

W, H, SCALE = 640, 320, 6  # px, px, px per metre

class Item(SimulationItem):
    title = "Projectile motion"
    tick_hz = 30

    def setup(self):
        s = self.saved_state or {}
        self.angle = s.get("angle", self.params.get("angle", 45))
        self.speed = s.get("speed", 20.0)
        self.best_range = s.get("best_range", 0.0)
        self.path: list[tuple[float, float]] = []
        self.sim_time = 0.0

    def get_state(self):
        return {"_v": 1, "angle": self.angle, "speed": self.speed,
                "best_range": self.best_range}

    def launch(self, _=None):
        self.path, self.sim_time = [], 0.0
        self.start()

    def tick(self, dt):
        self.sim_time += dt
        vx = self.speed * math.cos(math.radians(self.angle))
        vy = self.speed * math.sin(math.radians(self.angle))
        x = vx * self.sim_time
        y = vy * self.sim_time - 0.5 * G * self.sim_time ** 2
        if y < 0:
            self.pause()
            self.best_range = max(self.best_range, x)
            self.persist()
            self.complete()
        else:
            self.path.append((x, y))

    def render(self):
        cmds = [draw.clear("#0b1220"), draw.grid(SCALE * 5),
                draw.line(0, H - 1, W, H - 1, "#475569", 2)]
        for x, y in self.path:
            cmds.append(draw.circle(x * SCALE, H - y * SCALE, 2, fill="#7dd3fc"))
        return Column(
            Row(
                Slider("Angle (°)", 10, 80, 1, self.angle,
                       on_change=lambda v: setattr(self, "angle", v)),
                Slider("Speed (m/s)", 5, 40, 1, self.speed,
                       on_change=lambda v: setattr(self, "speed", v)),
                Button("Launch", on_click=self.launch),
                Button("Reset", on_click=lambda _: self.setup(), kind="secondary"),
            ),
            Canvas(W, H, cmds),
            Text(f"t = {self.sim_time:.2f} s   ·   best range: "
                 f"{self.best_range:.1f} m", mono=True),
        )
