# The discriminant and sketching quadratic graphs

## The discriminant

Inside the quadratic formula sits the expression $b^2 - 4ac$, called the **discriminant**. It tells you how many real roots $ax^2+bx+c=0$ has, without solving the equation:

| Value of $b^2 - 4ac$ | Number/nature of roots                              |
| --------------------- | ---------------------------------------------------- |
| $b^2 - 4ac > 0$        | Two distinct real roots                              |
| $b^2 - 4ac = 0$        | One repeated real root (the curve touches the $x$-axis) |
| $b^2 - 4ac < 0$        | No real roots (the curve does not meet the $x$-axis) |

**Example.** Find the discriminant of $2x^2 - 4x + 5 = 0$ and state the number of real roots.

$$
b^2 - 4ac = (-4)^2 - 4(2)(5) = 16 - 40 = -24 < 0.
$$

Since the discriminant is negative, this equation has **no real roots** — the graph of $y = 2x^2 - 4x + 5$ never crosses the $x$-axis.

:::reveal{title="Worked example: repeated root"}
Find the discriminant of $x^2 - 6x + 9 = 0$ and solve it.

$$
b^2 - 4ac = (-6)^2 - 4(1)(9) = 36 - 36 = 0.
$$

The discriminant is zero, so there is exactly one repeated root. Factorising confirms this: $x^2 - 6x + 9 = (x-3)^2 = 0$, so $x = 3$ (repeated).

*Check:* $3^2 - 6(3) + 9 = 9 - 18 + 9 = 0$. ✓
:::

:::callout{kind="info"}
The discriminant is also the tool for finding **unknown coefficients**. For example, if $x^2 + kx + 9 = 0$ has a repeated root, then $k^2 - 4(1)(9) = 0$, so $k^2 = 36$ and $k = \pm 6$.
:::

## Sketching quadratic graphs

The graph of $y = ax^2 + bx + c$ is a **parabola**: it opens upward if $a > 0$ (a minimum turning point) and downward if $a < 0$ (a maximum turning point). To sketch it, identify:

1. The **$y$-intercept**: set $x = 0$, giving $y = c$.
2. The **$x$-intercepts** (roots): set $y = 0$ and solve, using factorising or the formula. If the discriminant is negative, there are none.
3. The **turning point**: from completed-square form $a(x+p)^2 + q$, the turning point is $(-p, q)$.

**Example.** Sketch $y = x^2 - 2x - 3$.

- $y$-intercept: $x=0 \Rightarrow y = -3$.
- Factorise: $x^2 - 2x - 3 = (x-3)(x+1)$, so roots at $x = 3$ and $x = -1$.
- Completed square: $x^2 - 2x - 3 = (x-1)^2 - 1 - 3 = (x-1)^2 - 4$, so the turning point (minimum, since $a=1>0$) is $(1, -4)$.

Explore this curve interactively below — note how the curve crosses the $x$-axis exactly at $x=-1$ and $x=3$, and dips to its minimum at $(1,-4)$.

::widget{type="function-grapher" expr="x^2 - 2x - 3" xmin=-4 xmax=6 ymin=-5 ymax=8 grid=true}

:::reveal{title="Worked example: a downward parabola"}
Sketch $y = -x^2 + 2x + 8$.

- $y$-intercept: $x=0 \Rightarrow y=8$.
- Factorise: $-x^2+2x+8 = -(x^2-2x-8) = -(x-4)(x+2)$, so roots at $x=4$ and $x=-2$.
- Completed square: $-x^2+2x+8 = -(x^2-2x) + 8 = -\left[(x-1)^2-1\right]+8 = -(x-1)^2+9$, so the turning point (maximum, since $a=-1<0$) is $(1,9)$.

*Check the roots:* at $x=4$: $-(16)+8+8=0$. ✓  at $x=-2$: $-(4)-4+8=0$. ✓
:::

:::callout{kind="key"}
Completing the square gives you the turning point *and* tells you the type: for $a(x+p)^2+q$, the point $(-p,q)$ is a **minimum** when $a>0$ and a **maximum** when $a<0$, because $(x+p)^2 \geq 0$ always.
:::

Understanding the discriminant and the shape of the graph together is essential for the next lesson, where we use exactly this picture — where the curve lies above or below the $x$-axis — to solve quadratic **inequalities**.
