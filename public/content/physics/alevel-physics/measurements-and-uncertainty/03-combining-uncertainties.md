# Combining uncertainties and graphs

Most physics results are not single measurements — they are calculated from two or more measured quantities. This lesson gives the three combination rules used throughout the course, then shows how the same idea applies to reading a gradient off a graph.

## Rule 1 — adding or subtracting measured quantities

When quantities are **added or subtracted**, their **absolute uncertainties add** (even when the quantities themselves are subtracted — the uncertainties never partially cancel, because you don't know the sign of each individual error):

$$
\Delta(a \pm b) = \Delta a + \Delta b.
$$

:::reveal{title="Worked example: a length difference"}
Two lengths are measured as $a = 12.4 \pm 0.1\,\mathrm{cm}$ and $b = 5.2 \pm 0.1\,\mathrm{cm}$. Find $a - b$ and its uncertainty.

$$
a - b = 12.4 - 5.2 = 7.2\,\mathrm{cm}.
$$

$$
\Delta(a-b) = \Delta a + \Delta b = 0.1 + 0.1 = 0.2\,\mathrm{cm}.
$$

Result: $(7.2 \pm 0.2)\,\mathrm{cm}$.
:::

## Rule 2 — multiplying or dividing measured quantities

When quantities are **multiplied or divided**, their **percentage (or fractional) uncertainties add**:

$$
\%\Delta(ab) = \%\Delta a + \%\Delta b, \qquad \%\Delta\!\left(\frac{a}{b}\right) = \%\Delta a + \%\Delta b.
$$

:::reveal{title="Worked example: the area of a rectangle"}
A rectangle has length $l = 8.0 \pm 0.2\,\mathrm{cm}$ and width $w = 5.0 \pm 0.1\,\mathrm{cm}$. Find the area and its uncertainty.

**Percentage uncertainties of each side:**
$$
\%\Delta l = \frac{0.2}{8.0}\times 100 = 2.5\%, \qquad \%\Delta w = \frac{0.1}{5.0}\times 100 = 2.0\%.
$$

**Add them (Rule 2):**
$$
\%\Delta(\text{area}) = 2.5\% + 2.0\% = 4.5\%.
$$

**Area itself:**
$$
A = l \times w = 8.0 \times 5.0 = 40.0\,\mathrm{cm^2}.
$$

**Convert the percentage back to an absolute uncertainty:**
$$
\Delta A = 4.5\% \times 40.0 = 1.8\,\mathrm{cm^2}.
$$

Result: $A = (40.0 \pm 1.8)\,\mathrm{cm^2}$.
:::

## Rule 3 — raising a measured quantity to a power

When a quantity is raised to a power $n$, its **percentage uncertainty is multiplied by $n$** (ignoring sign — a square root, $n = \tfrac12$, still multiplies the percentage uncertainty by $\tfrac12$):

$$
\%\Delta(a^n) = |n| \times \%\Delta a.
$$

:::reveal{title="Worked example: the volume of a sphere"}
A sphere's radius is measured as $r = 3.0 \pm 0.1\,\mathrm{cm}$. Its volume is $V = \tfrac{4}{3}\pi r^3$. Find the percentage uncertainty in $V$.

**Percentage uncertainty in $r$:**
$$
\%\Delta r = \frac{0.1}{3.0}\times 100 = 3.33\% \ (\text{3 s.f.}).
$$

**Apply Rule 3 with $n = 3$:**
$$
\%\Delta V = 3 \times 3.33\% = 10.0\%.
$$

Notice that the constant $\tfrac{4}{3}\pi$ carries no uncertainty at all — it is an exact number, not a measurement — so it never appears in the uncertainty calculation, only in the value of $V$ itself ($V = \tfrac{4}{3}\pi(3.0)^3 = 113\,\mathrm{cm^3}$, so $\Delta V = 10.0\% \times 113 \approx 11\,\mathrm{cm^3}$).
:::

:::callout{kind="warning"}
These three rules only combine the uncertainty due to *measured* quantities. Exact numbers (like the $2$ in $2\pi r$, or a count of objects) and defined constants contribute no uncertainty of their own.
:::

## Uncertainty from a graph: the max/min gradient method

When a quantity is found from the **gradient** of a best-fit line (for example, finding a spring constant from a load–extension graph), the uncertainty in the gradient is found graphically rather than by the algebraic rules above.

The chart below shows six load–extension readings for a spring, each with an uncertainty of $\pm 0.3\,\mathrm{cm}$ in the extension (from reading a ruler against a moving pointer):

::widget{type="data-plot" src="data/spring-extension.json"}

To turn that scatter (plus the error bar on each point) into a gradient **and its uncertainty**, work through the steps below:

::widget{type="step-reveal" src="steps/max-min-gradient.json"}

:::reveal{title="Worked example: gradient uncertainty from the spring data above"}
Using the error bars ($\pm 0.3\,\mathrm{cm}$ on every extension reading):

**Steepest line** — through a point near $(1.0, 1.9+(-0.3)) = (1.0, 1.6)$ and a point near $(6.0, 12.1+0.3) = (6.0, 12.4)$:
$$
g_{\max} = \frac{12.4 - 1.6}{6.0 - 1.0} = \frac{10.8}{5.0} = 2.16\,\mathrm{cm\,N^{-1}}.
$$

**Shallowest line** — through a point near $(1.0, 1.9+0.3) = (1.0, 2.2)$ and a point near $(6.0, 12.1-0.3) = (6.0, 11.8)$:
$$
g_{\min} = \frac{11.8 - 2.2}{6.0 - 1.0} = \frac{9.6}{5.0} = 1.92\,\mathrm{cm\,N^{-1}}.
$$

**Uncertainty in the gradient:**
$$
\Delta g = \frac{g_{\max} - g_{\min}}{2} = \frac{2.16 - 1.92}{2} = \frac{0.24}{2} = 0.12 \approx 0.1\,\mathrm{cm\,N^{-1}} \ (\text{1 s.f.}).
$$

If the best-fit line (drawn by eye through the middle of the data) has gradient $2.0\,\mathrm{cm\,N^{-1}}$, the final result is quoted as
$$
g = (2.0 \pm 0.1)\,\mathrm{cm\,N^{-1}}.
$$

A gradient is always quoted to the same number of decimal places as its uncertainty — there is no point writing $2.043$ when you only know it to $\pm 0.1$.
:::

You now have the complete measurement toolkit used throughout this course: units and significant figures to report a number sensibly, error type to know what to fix, and the combination rules — algebraic or graphical — to carry an uncertainty all the way through to a final answer. Every later module that asks you to evaluate a measurement or a graph will assume you can do this.
