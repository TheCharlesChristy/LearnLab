# Gradient descent explorer (PlotExplorerItem, SRS §6.8).
# Trains y = w*x + b on the module's fixed 3-point sales dataset by calling
# the EXISTING courselib.ai.train_linreg_1d helper directly — no training
# logic is written here, only two sliders (learning rate, epoch count) wired
# to that helper and plotted, exactly like items/perceptron-explorer.py wires
# sliders to courselib.ai.sigmoid. Drag "Learning rate" to see how step size
# controls convergence (push it high enough and the fit visibly diverges);
# drag "Epochs" to watch the fitted line move closer to the data as training
# runs longer.
from learnsdk import PlotExplorerItem, Ctl
from courselib.ai import train_linreg_1d

# Hours of sunshine (x) vs ice-cream van sales in tens of £ (y) — the same
# three points used throughout this module's lessons and worked examples.
POINTS = [(1.0, 2.0), (2.0, 5.0), (3.0, 8.0)]


class Item(PlotExplorerItem):
    title = "Gradient descent explorer: fitting y = w·x + b"
    controls = [
        Ctl("lr", "Learning rate η", 0.001, 0.2, 0.001, default=0.05),
        Ctl("epochs", "Epochs", 1, 200, 1, default=40),
    ]
    x_range = (0.0, 4.0)

    def f(self, x, lr, epochs):
        # Full-batch gradient descent from the fixed (w=0, b=0) start, using
        # the already-existing helper's exact history of {epoch, w, b, loss}.
        history = train_linreg_1d(POINTS, lr, int(epochs))
        final = history[-1]
        return final["w"] * x + final["b"]
