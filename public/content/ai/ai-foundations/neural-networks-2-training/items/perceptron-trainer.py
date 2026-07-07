# Live perceptron trainer (SimulationItem, SRS §6.8), mirroring the
# tick-driven pattern of the canonical projectile.py reference item (§6.13b):
# tick() advances the simulation by one step, render() redraws a Canvas from
# scratch every time. Here "advancing" means running one perceptron-learning-
# rule update on the next training example, exactly the algorithm and data
# set traced by hand in this module's first two lessons (w1=w2=b=0, eta=1,
# examples (0,0)->0, (1,0)->0, (2,2)->1, (3,3)->1). The decision boundary
# line and every data point are redrawn each tick, so learners watch the
# same numbers from the lesson text move live. No learnsdk/courselib changes
# were needed: the training loop below is ordinary content code, same as
# courselib.ai.train_linreg_1d is ordinary content code for the regression
# module's gradient descent.
from learnsdk import SimulationItem, Column, Row, Text, Canvas, draw

# The exact data set traced by hand in lessons 1 and 2 of this module.
EXAMPLES = [(0.0, 0.0, 0), (1.0, 0.0, 0), (2.0, 2.0, 1), (3.0, 3.0, 1)]
LEARNING_RATE = 1.0
MAX_EPOCHS = 30  # safety cap; this data set converges in 2 epochs (see lessons)

W, H, MARGIN = 480, 380, 40
DOMAIN_LO, DOMAIN_HI = -1.0, 4.0  # x1 and x2 both range over this window


def _step(z: float) -> int:
    """The step activation: fires (1) iff the weighted sum is >= 0."""
    return 1 if z >= 0 else 0


class Item(SimulationItem):
    title = "Train a perceptron: watch the decision boundary move"
    tick_hz = 2  # one training example processed every 0.5 s while playing

    def setup(self):
        s = self.saved_state
        if s:
            self.w1 = s.get("w1", 0.0)
            self.w2 = s.get("w2", 0.0)
            self.b = s.get("b", 0.0)
            self.epoch = s.get("epoch", 0)
            self.idx = s.get("idx", 0)
            self.converged = s.get("converged", False)
        else:
            self._reset_training()

    def get_state(self):
        return {
            "_v": 1,
            "w1": self.w1,
            "w2": self.w2,
            "b": self.b,
            "epoch": self.epoch,
            "idx": self.idx,
            "converged": self.converged,
        }

    def _reset_training(self):
        self.w1 = 0.0
        self.w2 = 0.0
        self.b = 0.0
        self.epoch = 0
        self.idx = 0
        self.converged = False

    def reset_sim(self, _value=None):
        # Extend the base transport's Reset: stop the clock (base behaviour)
        # AND restore the training state to w1=w2=b=0, epoch 0.
        super().reset_sim(_value)
        self._reset_training()

    def _predict(self, x1, x2):
        return _step(self.w1 * x1 + self.w2 * x2 + self.b)

    def _all_correct(self):
        return all(self._predict(x1, x2) == t for x1, x2, t in EXAMPLES)

    def tick(self, dt):
        if self.converged:
            self.pause()
            return

        x1, x2, target = EXAMPLES[self.idx]
        y = self._predict(x1, x2)
        error = target - y
        if error != 0:
            self.w1 += LEARNING_RATE * error * x1
            self.w2 += LEARNING_RATE * error * x2
            self.b += LEARNING_RATE * error

        self.idx += 1
        if self.idx >= len(EXAMPLES):
            # A full epoch just finished. Convergence means every example is
            # classified correctly by the resulting weights (checked fresh,
            # exactly as lesson 2's worked example rechecks all four rows
            # against the end-of-epoch weights) -- not merely "no updates
            # were needed during this particular pass", which can lag behind
            # by an epoch when an update late in the pass happens to also fix
            # an earlier example.
            self.idx = 0
            self.epoch += 1
            if self._all_correct():
                self.converged = True
                self.pause()
                self.persist()
                self.complete()
            elif self.epoch >= MAX_EPOCHS:
                self.pause()
                self.persist()

    def _to_px(self, x1, x2):
        scale = (W - 2 * MARGIN) / (DOMAIN_HI - DOMAIN_LO)
        px = MARGIN + (x1 - DOMAIN_LO) * scale
        py = H - MARGIN - (x2 - DOMAIN_LO) * scale
        return px, py

    def render(self):
        cmds = [draw.clear("#0b1220"), draw.grid(40)]

        # Axes through the origin.
        ox, oy = self._to_px(0, DOMAIN_LO)
        _, oy_top = self._to_px(0, DOMAIN_HI)
        ax_lo, _ = self._to_px(DOMAIN_LO, 0)
        ax_hi, _ = self._to_px(DOMAIN_HI, 0)
        _, axis_y = self._to_px(0, 0)
        cmds.append(draw.line(ox, oy, ox, oy_top, "#475569", 1))
        cmds.append(draw.line(ax_lo, axis_y, ax_hi, axis_y, "#475569", 1))

        # The decision boundary w1*x1 + w2*x2 + b = 0, if it is currently defined.
        if abs(self.w2) > 1e-9:
            y_lo = -(self.w1 * DOMAIN_LO + self.b) / self.w2
            y_hi = -(self.w1 * DOMAIN_HI + self.b) / self.w2
            x1_px, y1_px = self._to_px(DOMAIN_LO, y_lo)
            x2_px, y2_px = self._to_px(DOMAIN_HI, y_hi)
            cmds.append(draw.line(x1_px, y1_px, x2_px, y2_px, "#facc15", 2))
        elif abs(self.w1) > 1e-9:
            x_at = -self.b / self.w1
            x1_px, y1_px = self._to_px(x_at, DOMAIN_LO)
            x2_px, y2_px = self._to_px(x_at, DOMAIN_HI)
            cmds.append(draw.line(x1_px, y1_px, x2_px, y2_px, "#facc15", 2))

        # Data points: fill colour shows the true label, ring colour shows
        # whether the *current* boundary classifies that point correctly.
        for x1, x2, target in EXAMPLES:
            px, py = self._to_px(x1, x2)
            fill = "#38bdf8" if target == 1 else "#f97316"
            correct = self._predict(x1, x2) == target
            stroke = "#22c55e" if correct else "#ef4444"
            cmds.append(draw.circle(px, py, 7, fill=fill, stroke=stroke, width=3))

        status = "converged!" if self.converged else ("training…" if self.running else "paused")
        return Column(
            self.transport(),
            Canvas(W, H, cmds),
            Text(
                f"epoch {self.epoch}   w1 = {self.w1:.2f}   w2 = {self.w2:.2f}   "
                f"b = {self.b:.2f}   ({status})",
                mono=True,
            ),
            Row(
                Text("● target 0", color="#f97316", size="sm"),
                Text("● target 1", color="#38bdf8", size="sm"),
                Text("ring: green = correctly classified now, red = misclassified now", size="sm"),
            ),
        )
