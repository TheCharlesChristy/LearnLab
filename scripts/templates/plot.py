# Parameter-exploration plot (PlotExplorerItem, SRS §6.8). Set the controls,
# the x_range, and f(self, x, **controls); the base renders one slider per
# control plus a live FunctionPlot. No setup()/render() needed.
from learnsdk import PlotExplorerItem, Ctl


class Item(PlotExplorerItem):
    title = "Damped oscillation"
    controls = [
        Ctl("zeta", "Damping ratio ζ", 0.0, 1.5, 0.05, default=0.2),
        Ctl("w", "ω (rad/s)", 0.5, 10.0, 0.5, default=3.0),
    ]
    x_range = (0.0, 10.0)

    def f(self, x, zeta, w):
        import math

        return math.exp(-zeta * w * x) * math.cos(
            w * math.sqrt(max(1 - zeta**2, 1e-9)) * x
        )
