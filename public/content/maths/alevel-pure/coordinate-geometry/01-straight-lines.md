# Straight lines: gradient, equations, parallel and perpendicular

Coordinate geometry lets us describe lines and curves using algebra. This lesson covers the tools you need for straight lines: the gradient formula, the two standard forms of the equation of a line, and the conditions for two lines to be parallel or perpendicular. We also meet the midpoint and distance formulas, which describe a line segment joining two points.

## The gradient of a line through two points

If a line passes through $(x_1, y_1)$ and $(x_2, y_2)$, its gradient is

$$
m = \frac{y_2 - y_1}{x_2 - x_1}, \qquad x_1 \ne x_2.
$$

The gradient measures how much $y$ increases for every unit increase in $x$. A positive gradient slopes upward left-to-right; a negative gradient slopes downward.

:::reveal{title="Worked example: finding a gradient"}
Find the gradient of the line through $A(1, 2)$ and $B(4, 11)$.

$$
m = \frac{11 - 2}{4 - 1} = \frac{9}{3} = 3.
$$

The line rises 3 units for every 1 unit moved right.
:::

## Equations of a line

Two equivalent forms are used throughout A-level:

- **Gradient–intercept form**: $y = mx + c$, where $m$ is the gradient and $c$ is the $y$-intercept (the value of $y$ when $x = 0$).
- **General form**: $ax + by + c = 0$, where $a$, $b$, $c$ are constants (often chosen to be integers). This form is useful because it treats $x$ and $y$ symmetrically and handles vertical lines ($x = k$), which have no gradient in the $y = mx+c$ sense.

To find the equation of a line through a known point $(x_1, y_1)$ with gradient $m$, use

$$
y - y_1 = m(x - x_1).
$$

:::reveal{title="Worked example: equation of a line through a point"}
Find the equation of the line through $(2, -1)$ with gradient $3$, in the form $y = mx + c$.

$$
y - (-1) = 3(x - 2) \implies y + 1 = 3x - 6 \implies y = 3x - 7.
$$

Rearranged into general form: $3x - y - 7 = 0$.
:::

Explore how changing the gradient and intercept changes the line:

::widget{type="function-grapher" expr="3*x - 7" xmin=-4 xmax=6 grid=true}

:::callout{kind="info"}
Any equation of the form $y = mx+c$ can be entered into the grapher above as an expression in $x$ (e.g. `3*x - 7`), since a non-vertical straight line is just a function $y = f(x)$ with $f$ linear.
:::

## Parallel and perpendicular lines

- **Parallel lines have equal gradients**: if line 1 has gradient $m_1$ and line 2 has gradient $m_2$, the lines are parallel iff $m_1 = m_2$.
- **Perpendicular lines have gradients that multiply to $-1$**: two non-vertical lines are perpendicular iff

$$
m_1 m_2 = -1, \qquad \text{equivalently} \qquad m_2 = -\frac{1}{m_1}.
$$

:::callout{kind="key"}
To find the gradient of a line perpendicular to a line of gradient $m$, flip the fraction and change the sign: the **negative reciprocal** $-1/m$.
:::

:::reveal{title="Worked example: perpendicular line through a point"}
Find the equation of the line perpendicular to $y = 2x - 3$ that passes through $(4, 1)$.

The gradient of $y = 2x - 3$ is $m_1 = 2$, so the perpendicular gradient is

$$
m_2 = -\frac{1}{2}.
$$

Using $y - y_1 = m(x-x_1)$ with $(x_1,y_1) = (4,1)$:

$$
y - 1 = -\tfrac{1}{2}(x - 4) \implies y = -\tfrac{1}{2}x + 2 + 1 = -\tfrac{1}{2}x + 3.
$$
:::

## Midpoint and distance between two points

For two points $(x_1, y_1)$ and $(x_2, y_2)$:

**Midpoint** (the point exactly halfway between them):

$$
M = \left( \frac{x_1 + x_2}{2}, \; \frac{y_1 + y_2}{2} \right).
$$

**Distance** (length of the segment joining them), from Pythagoras' theorem applied to the horizontal and vertical differences:

$$
d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}.
$$

:::reveal{title="Worked example: midpoint and distance"}
Find the midpoint of, and distance between, $P(-2, 3)$ and $Q(6, -1)$.

Midpoint:

$$
M = \left( \frac{-2+6}{2}, \frac{3+(-1)}{2} \right) = (2, 1).
$$

Distance:

$$
d = \sqrt{(6-(-2))^2 + (-1-3)^2} = \sqrt{8^2 + (-4)^2} = \sqrt{64+16} = \sqrt{80} = 4\sqrt{5}.
$$
:::

These two formulas reappear constantly in the next two lessons: the midpoint of a chord lies on the perpendicular bisector through a circle's centre, and the distance formula is exactly how the equation of a circle is built.

Check your understanding with a quick quiz question embedded here:

::widget{type="quiz" src="assessment.json" pick=3}
