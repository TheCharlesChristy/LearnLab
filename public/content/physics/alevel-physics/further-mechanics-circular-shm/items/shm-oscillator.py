# SHM displacement-time explorer (PlotExplorerItem, SRS §6.8).
# Plots x(t) = A * cos(omega * t) for an undamped simple-harmonic oscillator.
# Drag the amplitude A to stretch the curve vertically and the angular
# frequency omega to compress the period T = 2*pi/omega horizontally; the
# base class renders one slider per Ctl plus a live FunctionPlot of f.
import math
from learnsdk import PlotExplorerItem, Ctl


class Item(PlotExplorerItem):
    title = "SHM displacement: x(t) = A cos(ωt)"
    controls = [
        Ctl("A", "Amplitude A (m)", 0.02, 0.10, 0.01, default=0.05),
        Ctl("w", "Angular frequency ω (rad/s)", 1.0, 10.0, 0.5, default=4.0),
    ]
    x_range = (0.0, 10.0)

    def f(self, x, A, w):
        # x here is time t (seconds); the returned value is displacement (m).
        return A * math.cos(w * x)
