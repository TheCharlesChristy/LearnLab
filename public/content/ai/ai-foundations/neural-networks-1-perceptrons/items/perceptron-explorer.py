# Perceptron activation explorer (PlotExplorerItem, SRS §6.8).
# Plots a single-input neuron's output f(x) = sigmoid(w*x + b). Drag the
# weight w to steepen/flip the curve and the bias b to shift it left/right;
# the base renders one slider per Ctl plus a live FunctionPlot. The sigmoid
# comes from courselib.ai so the maths matches the lessons exactly.
from learnsdk import PlotExplorerItem, Ctl
from courselib.ai import sigmoid


class Item(PlotExplorerItem):
    title = "Perceptron activation: f(x) = sigmoid(w·x + b)"
    controls = [
        Ctl("w", "Weight w", -5.0, 5.0, 0.1, default=1.0),
        Ctl("b", "Bias b", -5.0, 5.0, 0.1, default=0.0),
    ]
    x_range = (-10.0, 10.0)

    def f(self, x, w, b):
        # Pre-activation (weighted sum) z, then squashed by the sigmoid.
        z = w * x + b
        return sigmoid(z)
