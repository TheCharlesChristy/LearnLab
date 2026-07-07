# Plotting and reading quadratic graphs

In *Quadratics Intro* you met the parabola — the characteristic U-shaped curve produced by a quadratic expression. Here we plot one from scratch using a table of values, and practise reading its key features straight off the graph.

## Building a table of values

To plot $y = x^2 + bx + c$ by hand, choose a sensible range of $x$-values (usually a handful of consecutive integers either side of zero), substitute each one into the rule, and record the resulting $y$-values in a table.

:::reveal{title="Worked example: table of values for y = x^2 - 2x - 3"}
Complete a table of values for $y = x^2 - 2x - 3$ for $x = -2, -1, 0, 1, 2, 3, 4$.

| $x$ | $-2$ | $-1$ | $0$  | $1$  | $2$  | $3$ | $4$ |
|-----|------|------|------|------|------|-----|-----|
| $y$ | $5$  | $0$  | $-3$ | $-4$ | $-3$ | $0$ | $5$ |

For example, at $x = -2$: $y = (-2)^2 - 2(-2) - 3 = 4 + 4 - 3 = 5$. At $x = 1$: $y = 1^2 - 2(1) - 3 = 1 - 2 - 3 = -4$.

Plotting these seven points and joining them with a smooth curve (never straight line segments) gives a symmetric U-shaped parabola.
:::

Explore the same curve interactively — the graph below plots $y = x^2 - 2x - 3$:

::widget{type="function-grapher" expr="x^2 - 2*x - 3" xmin=-4 xmax=6 grid=true}

## Reading off the turning point and roots

Once a quadratic graph is plotted, two features are usually the most useful to read approximately straight from the curve, without further algebra:

- The **turning point** (or vertex): the single point where the curve changes from decreasing to increasing (a minimum, for a curve that opens upward) or from increasing to decreasing (a maximum, for a curve that opens downward). It is the lowest or highest point on the graph.
- The **roots** (or $x$-intercepts): the point(s) where the curve crosses the $x$-axis, i.e. where $y = 0$.

:::callout{kind="key"}
A quadratic graph is always symmetric about a vertical line through its turning point. This means the turning point's $x$-coordinate sits exactly halfway between the two roots (when there are two).
:::

:::reveal{title="Worked example: reading features from the table/graph"}
Using the table above for $y = x^2 - 2x - 3$: the $y$-values dip to a minimum of $-4$ at $x = 1$ and rise symmetrically either side, so the turning point is $(1, -4)$. The curve crosses $y = 0$ between $x=-1$ and $x=0$... in fact exactly at $x = -1$ (where $y = 0$) and exactly at $x = 3$ (where $y = 0$), so the roots are $x = -1$ and $x = 3$.

Check the symmetry: the midpoint of the roots is $\dfrac{-1 + 3}{2} = 1$, which matches the turning point's $x$-coordinate found above.
:::

In this course we only read these features **approximately from a plotted graph**; finding them exactly by algebra (completing the square, factorising, or the quadratic formula) is covered in *Quadratics Intro* and beyond.

## Recognising linear vs quadratic graphs from their equation

You can often tell what shape a graph will have just by looking at the highest power of $x$ in its equation, without plotting a single point:

- If the equation can be written as $y = mx + c$ (only $x^1$, no $x^2$ term), the graph is a **straight line**.
- If the equation contains an $x^2$ term (e.g. $y = x^2 + bx + c$), the graph is a **parabola** — a U-shape (opening upward if the $x^2$ coefficient is positive) or an upside-down U-shape (opening downward if it's negative).

:::reveal{title="Worked example: linear or quadratic?"}
Classify each equation as giving a straight line or a parabola: (a) $y = 5 - 2x$, (b) $y = x^2 + 1$, (c) $y = 3x$.

(a) Only an $x^1$ term appears (in the form $y = mx+c$ with $m=-2, c=5$) — a **straight line**.
(b) An $x^2$ term appears — a **parabola**, opening upward since the coefficient of $x^2$ is positive.
(c) This is $y = 3x + 0$, of the form $y = mx + c$ — a **straight line** through the origin.
:::

Test your understanding of everything in this module with the assessment below.

::widget{type="quiz" src="assessment.json" pick=8}
