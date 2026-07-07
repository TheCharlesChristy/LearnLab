# Errors and uncertainty

No measurement is ever perfectly exact. Every instrument has a finite resolution, every observer has a finite reaction time, and every apparatus can be slightly miscalibrated. Rather than pretending a measurement is exact, physicists quote a **best estimate together with an uncertainty**, so that anyone reading the result knows the range within which the true value is likely to lie.

## Systematic vs random error

Errors fall into two broad categories, and telling them apart matters because you fix them in different ways.

:::callout{kind="key"}
A **systematic error** shifts every reading by the same amount, in the same direction (e.g. a top-pan balance that always reads $0.05\,\mathrm{g}$ high because it was never zeroed). A **random error** causes readings to scatter unpredictably above and below the true value (e.g. reaction-time variation when using a stopwatch).
:::

| | Systematic error | Random error |
| --- | --- | --- |
| Effect on readings | Consistent shift, same direction every time | Unpredictable scatter, both directions |
| Typical causes | Zero error, poor calibration, consistent parallax from the same viewing angle, a flawed method (e.g. always measuring to the wrong point) | Reaction time, reading a scale to its finest division, small fluctuating environmental effects |
| How to reduce it | Recalibrate against a known standard; correct for a known zero error; change the method | Take repeat readings and average; use an instrument with a finer scale; increase the number of trials |
| Effect of averaging repeats | **Not** reduced — averaging a set of readings that are all shifted the same way still gives a shifted average | **Is** reduced — scatter above and below the true value partially cancels as you average more readings |

The single most important consequence of this table: repeating a measurement and averaging only helps with random error. If your ruler has a bent end, measuring the same length one hundred times and averaging will not fix the systematic offset.

## Absolute, fractional and percentage uncertainty

Suppose you measure a length as $x = 12.4\,\mathrm{cm}$ using a ruler marked in millimetres. Because you can only read the ruler to about half of its smallest division, you estimate the **absolute uncertainty** as

$$
\Delta x = 0.05\,\mathrm{cm}.
$$

We write the result as $x = (12.4 \pm 0.05)\,\mathrm{cm}$. Two further ways of expressing the same uncertainty are often more useful for comparing measurements of different sizes:

$$
\text{fractional uncertainty} = \frac{\Delta x}{x}, \qquad
\text{percentage uncertainty} = \frac{\Delta x}{x} \times 100\%.
$$

:::callout{kind="tip"}
Percentage uncertainty is the natural way to compare *how precise* two very different measurements are. A $\pm 1\,\mathrm{mm}$ uncertainty is negligible on a $2\,\mathrm{m}$ length ($0.05\%$) but huge on a $3\,\mathrm{mm}$ diameter ($33\%$).
:::

When several repeat readings are taken, a common (though not the only) estimate of the absolute uncertainty is half the range of the readings:

$$
\Delta x \approx \frac{x_{\max} - x_{\min}}{2}.
$$

Try changing the readings below and re-running to see how the spread of repeats affects the uncertainty:

::widget{type="code-runner" language="python" starter='readings = [24.2, 24.6, 24.1, 24.5, 24.3]; mean = sum(readings) / len(readings); uncertainty = (max(readings) - min(readings)) / 2; percentage = uncertainty / mean * 100; print(f"mean = {mean:.2f} cm"); print(f"absolute uncertainty = {uncertainty:.2f} cm"); print(f"percentage uncertainty = {percentage:.2f} %")' rows=10}

:::reveal{title="Worked example: uncertainty in a caliper measurement"}
A ball bearing's diameter is measured five times with a digital caliper (resolution $0.01\,\mathrm{mm}$), giving $4.52, 4.55, 4.51, 4.54, 4.53\,\mathrm{mm}$.

**Mean:**
$$
\bar{x} = \frac{4.52+4.55+4.51+4.54+4.53}{5} = \frac{22.65}{5} = 4.53\,\mathrm{mm}.
$$

**Absolute uncertainty** (half the range of repeats):
$$
\Delta x = \frac{4.55 - 4.51}{2} = \frac{0.04}{2} = 0.02\,\mathrm{mm}.
$$

(This is larger than the caliper's own resolution uncertainty of $0.005\,\mathrm{mm}$, so the spread of repeats — not the instrument's resolution — is the limiting uncertainty here; always quote whichever is larger.)

**Percentage uncertainty:**
$$
\frac{0.02}{4.53}\times 100\% = 0.44\% \ (\text{to 2 s.f.}).
$$

Final result: diameter $= (4.53 \pm 0.02)\,\mathrm{mm}$, a percentage uncertainty of about $0.44\%$.
:::

So far we have only considered the uncertainty in a single measured quantity. Real experiments usually combine several measured quantities into a calculated result — the next lesson covers exactly how uncertainties propagate through arithmetic, and through a graph.
