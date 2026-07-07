# The parabola shape and x-intercepts

Every quadratic $y = ax^2 + bx + c$ produces the same family of curved shape when you plot it: a **parabola**. This lesson is a purely graphical, qualitative look at that shape — no calculus, and nothing beyond what you can read straight off a sketch.

## The basic u-shape

Plot $y = x^2$ for a range of $x$ values and you get a smooth curve that dips down to a lowest point and rises symmetrically on either side — a **u-shape**.

::widget{type="function-grapher" expr="x^2" xmin=-4 xmax=4 grid=true}

Every quadratic with a **positive** coefficient of $x^2$ (that is, $a > 0$) produces this same u-shaped curve, sometimes just shifted, stretched or shunted sideways compared with $y=x^2$. The lowest point of the curve is called the **minimum turning point**.

## Flipping it: a negative leading coefficient

Now compare that with $y = -x^2 + 4$, where $a = -1$ is **negative**.

::widget{type="function-grapher" expr="-x^2+4" xmin=-4 xmax=4 grid=true}

This time the curve rises to a highest point and falls away symmetrically on both sides — an **n-shape** (like an upside-down u). The highest point is called the **maximum turning point**.

:::callout{kind="key"}
The **sign of $a$** in $y = ax^2+bx+c$ completely decides which of the two shapes you get:

- $a > 0$: **u-shaped** parabola, opening upward, with a minimum turning point.
- $a < 0$: **n-shaped** parabola, opening downward, with a maximum turning point.

Nothing else about $b$ or $c$ changes this — they only move the curve left/right/up/down, they never flip it between the two shapes.
:::

## Where the parabola meets the x-axis

The points where a graph crosses the x-axis are exactly the points where $y = 0$ — so for $y = ax^2+bx+c$, the x-intercepts are the solutions of $ax^2+bx+c=0$. This links straight back to the factorising work in the last lesson: **if you can write the quadratic in factorised form, you can read off the x-intercepts immediately.**

**Example.** Where does $y = (x-2)(x+6)$ cross the x-axis?

Set $y = 0$:

$$
(x-2)(x+6) = 0 \implies x - 2 = 0 \ \text{or} \ x + 6 = 0 \implies x = 2 \ \text{or} \ x = -6.
$$

So the parabola crosses the x-axis at $x=2$ and $x=-6$ — two points, $(2, 0)$ and $(-6, 0)$.

To check the overall shape: expanding, $(x-2)(x+6) = x^2 + 4x - 12$, so $a = 1 > 0$ — this confirms it is u-shaped, consistent with a graph that dips down between its two x-intercepts.

::widget{type="function-grapher" expr="(x-2)*(x+6)" xmin=-9 xmax=5 grid=true}

:::reveal{title="Worked example: x-intercepts from a quadratic that needs factorising first"}
Find the x-intercepts of $y = x^2 + x - 12$.

*Factorise first:* we need two numbers multiplying to $-12$ and adding to $1$. Trying $4$ and $-3$: product $4 \times (-3) = -12$ ✓, sum $4 + (-3) = 1$ ✓.

$$
x^2+x-12 = (x+4)(x-3).
$$

*Set to zero:* $(x+4)(x-3) = 0 \implies x = -4$ or $x = 3$.

So the graph crosses the x-axis at $x=-4$ and $x=3$. Since $a=1>0$, the curve is u-shaped and dips below the x-axis between these two points, exactly as the factorised form predicts.
:::

## Putting it all together

Given any quadratic $y = ax^2+bx+c$, you can now:

1. Recognise it as quadratic from the $x^2$ term.
2. Decide its overall shape (u or n) instantly from the sign of $a$.
3. Factorise it (when $a=1$ and the numbers are nice integers) to find where it meets the x-axis.

This is deliberately a first, GCSE-level look at quadratic graphs. Further study (a-level content) goes on to find the exact turning point by completing the square, use the discriminant to predict *how many* times a parabola meets the x-axis without factorising, and solve quadratic inequalities — none of that is needed here.

::widget{type="quiz" src="assessment.json"}
