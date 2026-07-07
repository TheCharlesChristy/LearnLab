# Straight-line graphs and gradient

Every straight line (that isn't vertical) can be written in the form

$$
y = mx + c,
$$

where $m$ and $c$ are numbers that completely determine the line. Understanding what each one does is the key to reading, sketching and comparing straight-line graphs quickly — without plotting every point.

## What $m$ and $c$ mean

- $c$ is the **$y$-intercept**: the value of $y$ when $x = 0$. It tells you where the line crosses the $y$-axis, at the point $(0, c)$.
- $m$ is the **gradient** (or slope): how much $y$ increases for every $1$ unit increase in $x$.
  - If $m > 0$, the line slopes **up** left-to-right.
  - If $m < 0$, the line slopes **down** left-to-right.
  - If $m = 0$, the line is **horizontal** ($y = c$).
  - The larger $|m|$ is, the **steeper** the line.

:::callout{kind="key"}
In $y = mx + c$: $m$ controls the **steepness and direction** of the line; $c$ controls **where it crosses the $y$-axis**. Changing $c$ slides the whole line up or down without changing its slope; changing $m$ rotates the line about its $y$-intercept.
:::

Try changing the expression below (e.g. from `2*x - 1` to `-0.5*x + 4`) to see how the gradient and intercept change the line:

::widget{type="function-grapher" expr="2*x - 1" xmin=-6 xmax=6 grid=true}

:::reveal{title="Worked example: reading m and c from an equation"}
State the gradient and $y$-intercept of $y = -3x + 5$.

Comparing with $y = mx + c$: $m = -3$ and $c = 5$. The line slopes downward (since $m < 0$) and crosses the $y$-axis at $(0, 5)$.
:::

## Finding the gradient between two points

Sometimes you're given two points on a line rather than its equation. The gradient between $(x_1, y_1)$ and $(x_2, y_2)$ is the **change in $y$ divided by the change in $x$**:

$$
m = \frac{y_2 - y_1}{x_2 - x_1}, \qquad x_1 \ne x_2.
$$

This works because a straight line rises (or falls) by the *same* amount for every unit step in $x$, so the ratio "rise over run" is constant no matter which two points on the line you pick.

:::reveal{title="Worked example: gradient from two points"}
Find the gradient of the line through $A(1, 2)$ and $B(5, 14)$.

$$
m = \frac{14 - 2}{5 - 1} = \frac{12}{4} = 3.
$$

The line rises 3 units for every 1 unit moved to the right.
:::

:::reveal{title="Worked example: a negative gradient"}
Find the gradient of the line through $P(-2, 5)$ and $Q(3, -5)$.

$$
m = \frac{-5 - 5}{3 - (-2)} = \frac{-10}{5} = -2.
$$

The gradient is negative, so the line slopes downward left-to-right — it falls 2 units for every 1 unit moved to the right.
:::

:::callout{kind="tip"}
It doesn't matter which point you call $(x_1, y_1)$ and which you call $(x_2, y_2)$, as long as you keep $x$ and $y$ from the **same** point together and subtract in the **same order** on the top and bottom of the fraction. Swapping both pairs consistently gives the same answer.
:::

Once you know the gradient $m$ and one point $(x_1, y_1)$ on the line, you can also find $c$: substitute the point into $y = mx + c$ and solve for $c$. This lets you go from "two points" to a full equation $y = mx + c$ whenever you need one.
