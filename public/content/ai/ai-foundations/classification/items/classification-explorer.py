# Classification decision-boundary explorer (PlotExplorerItem, SRS §6.8).
# Plots a logistic-regression classifier's predicted probability
# f(x) = sigmoid(w*x + b) for a single feature x (e.g. hours studied). Drag
# the weight w to steepen/flip the curve and the bias b to slide the 0.5
# crossing point (the decision boundary) left or right. The base class
# renders one slider per Ctl plus a live FunctionPlot; the sigmoid comes
# from courselib.ai so the maths matches the lessons exactly.
from learnsdk import PlotExplorerItem, Ctl
from courselib.ai import sigmoid


class Item(PlotExplorerItem):
    title = "Classification: predicted probability = sigmoid(w·x + b)"
    controls = [
        Ctl("w", "Weight w", -3.0, 3.0, 0.1, default=1.0),
        Ctl("b", "Bias b", -10.0, 10.0, 0.5, default=-3.0),
    ]
    x_range = (0.0, 10.0)

    def f(self, x, w, b):
        # Pre-activation (weighted sum) z, then squashed by the sigmoid into
        # a probability. The x-value where this crosses 0.5 is the decision
        # boundary: everything to the right is predicted class 1.
        z = w * x + b
        return sigmoid(z)
