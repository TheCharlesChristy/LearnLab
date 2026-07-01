# The equation of a circle

A circle is the set of all points that are a fixed distance (the **radius**) from a fixed point (the **centre**). Using the distance formula from the previous lesson, we can turn this description directly into an equation.

## Deriving the equation of a circle

Let the centre be $(a, b)$ and the radius be $r$. A point $(x, y)$ lies on the circle exactly when its distance from $(a,b)$ equals $r$:

$$
\sqrt{(x-a)^2 + (y-b)^2} = r.
$$

Squaring both sides removes the square root and gives the standard form:

$$
(x-a)^2 + (y-b)^2 = r^2.
$$

:::callout{kind="key"}
$(x-a)^2 + (y-b)^2 = r^2$ is a circle with **centre $(a, b)$** and **radius $r$**. Read the centre coordinates as the negatives of the numbers subtracted from $x$ and $y$.
:::

:::reveal{title="Worked example: reading off centre and radius"}
State the centre and radius of $(x-3)^2 + (y+2)^2 = 25$.

Rewrite $(y+2)^2$ as $(y-(-2))^2$, so $a = 3$, $b = -2$, and $r^2 = 25 \Rightarrow r = 5$.

Centre $(3, -2)$, radius $5$.
:::

### Visualising a circle with the function grapher

The `function-grapher` widget plots $y = f(x)$, so it cannot draw a full circle directly (a circle is not a function of $x$ — most $x$-values give two $y$-values). Instead, a circle of radius $r$ centred at the origin can be split into its **upper and lower semicircles**:

$$
y = \sqrt{r^2 - x^2} \quad \text{(upper half)}, \qquad y = -\sqrt{r^2 - x^2} \quad \text{(lower half)}.
$$

Plotting both together traces out the whole circle. Here is the circle $x^2 + y^2 = 25$ (centre the origin, radius $5$), shown as its upper semicircle:

::widget{type="function-grapher" expr="sqrt(25 - x^2)" xmin=-5 xmax=5 ymin=-6 ymax=6 grid=true}

and its lower semicircle:

::widget{type="function-grapher" expr="-sqrt(25 - x^2)" xmin=-5 xmax=5 ymin=-6 ymax=6 grid=true}

:::callout{kind="tip"}
Outside $-5 \le x \le 5$ the expression $\sqrt{25-x^2}$ is undefined (negative under the square root), which is exactly right — the circle does not extend beyond $x = \pm 5$.
:::

A second way to see the shape of a circle is to plot sample points that satisfy its equation directly. The chart below scatters twelve points evenly spaced around $x^2+y^2=25$ (using $(5\cos\theta, 5\sin\theta)$ for twelve values of $\theta$), which traces the circle's outline without needing a function form:

::widget{type="data-plot" src="data/circle-points.json"}

## Completing the square: from general form to standard form

A circle's equation is often given in an expanded **general form**,

$$
x^2 + y^2 + 2fx + 2gy + c = 0,
$$

and you need to complete the square on the $x$-terms and the $y$-terms separately to recover the centre and radius.

:::reveal{title="Worked example: completing the square"}
Find the centre and radius of the circle $x^2 + y^2 - 6x + 4y - 12 = 0$.

Group $x$-terms and $y$-terms, moving the constant to the other side:

$$
(x^2 - 6x) + (y^2 + 4y) = 12.
$$

Complete the square on each bracket ($x^2-6x = (x-3)^2 - 9$ and $y^2+4y = (y+2)^2-4$):

$$
(x-3)^2 - 9 + (y+2)^2 - 4 = 12,
$$

$$
(x-3)^2 + (y+2)^2 = 12 + 9 + 4 = 25.
$$

So the centre is $(3, -2)$ and the radius is $\sqrt{25} = 5$.
:::

## The perpendicular bisector of a chord

A **chord** is a straight line segment joining two points on a circle. A key geometric fact:

:::callout{kind="key"}
The perpendicular bisector of any chord of a circle passes through the centre of the circle.
:::

This is because the centre is equidistant from every point on the circle, so it must be equidistant from the two endpoints of any chord — and the set of points equidistant from two given points is precisely their perpendicular bisector. This gives a method for finding a circle's centre from three points on its circumference: find the perpendicular bisector of two different chords and intersect them.

:::reveal{title="Worked example: using the perpendicular-bisector property"}
A circle passes through $A(1, 5)$ and $B(7, 5)$, and its centre lies on the line $y = x - 1$. Find the centre.

The midpoint of $AB$ is $\left(\frac{1+7}{2}, \frac{5+5}{2}\right) = (4, 5)$.

The gradient of $AB$ is $\frac{5-5}{7-1} = 0$ (a horizontal chord), so the perpendicular bisector is vertical: $x = 4$.

The centre lies on both $x = 4$ and $y = x - 1$, so $y = 4 - 1 = 3$. The centre is $(4, 3)$.
:::

The next lesson uses these ideas together with tangents to solve problems that mix lines and circles.
