from learnsdk import LearningItem, Column, Row, Slider, Canvas, Text, draw

W, H = 480, 340
CX = W // 2
GROUND_Y = 170
HALF = 25
PX_PER_N_H = 3.0     # horizontal force arrow scale (px per newton)
PX_PER_N_V = 0.5     # vertical (weight/normal) arrow scale (px per newton)


class Item(LearningItem):
    title = "Newton's second law: forces on a block"

    def setup(self):
        s = self.saved_state or {}
        self.mass = s.get("mass", 4.0)        # kg
        self.applied = s.get("applied", 12.0)  # N, horizontal

    def get_state(self):
        return {"_v": 1, "mass": self.mass, "applied": self.applied}

    def set_mass(self, value):
        self.mass = value
        self.persist()

    def set_applied(self, value):
        self.applied = value
        self.persist()

    def render(self):
        m = self.mass
        f = self.applied
        weight = m * 9.81
        a = f / m if m > 0 else 0.0

        cmds = [
            draw.clear("#0b1220"),
            draw.grid(20),
            draw.line(0, GROUND_Y + HALF, W, GROUND_Y + HALF, "#475569", 2),
            draw.rect(CX - HALF, GROUND_Y - HALF, 2 * HALF, 2 * HALF,
                       fill="#1e293b", stroke="#e2e8f0", width=2),
            # applied force: right, blue
            draw.arrow(CX + HALF, GROUND_Y, CX + HALF + f * PX_PER_N_H, GROUND_Y,
                        color="#7dd3fc", width=3),
            draw.text(CX + HALF + f * PX_PER_N_H + 6, GROUND_Y - 4,
                       f"F = {f:.0f} N", color="#7dd3fc"),
            # weight: down, orange
            draw.arrow(CX, GROUND_Y + HALF, CX, GROUND_Y + HALF + weight * PX_PER_N_V,
                        color="#fb923c", width=3),
            draw.text(CX + 6, GROUND_Y + HALF + weight * PX_PER_N_V + 12,
                       f"W = mg = {weight:.1f} N", color="#fb923c"),
            # normal reaction: up, green
            draw.arrow(CX - HALF - 14, GROUND_Y - HALF,
                        CX - HALF - 14, GROUND_Y - HALF - weight * PX_PER_N_V,
                        color="#4ade80", width=3),
            draw.text(CX - HALF - 14, GROUND_Y - HALF - weight * PX_PER_N_V - 10,
                       f"N = {weight:.1f} N", color="#4ade80"),
        ]

        return Column(
            Row(
                Slider("Mass (kg)", 1, 20, 0.5, m, on_change=self.set_mass),
                Slider("Applied force (N)", 0, 60, 1, f, on_change=self.set_applied),
            ),
            Canvas(W, H, cmds),
            Text(f"On a frictionless horizontal surface: a = F / m = "
                 f"{f:.0f} / {m:.1f} = {a:.2f} m s⁻². "
                 f"Vertically N balances W, so there is no vertical acceleration.",
                 mono=True),
        )
