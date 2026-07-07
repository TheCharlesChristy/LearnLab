# Quadratic inequalities and linear-quadratic simultaneous equations

## Solving quadratic inequalities

To solve a quadratic inequality such as $x^2 - x - 6 > 0$, first solve the **equation** $x^2 - x - 6 = 0$ to find the **critical values**, then use the shape of the graph (or a sign diagram) to decide which region(s) satisfy the inequality.

**Example.** Solve $x^2 - x - 6 > 0$.

Factorise: $x^2 - x - 6 = (x-3)(x+2)$, so the critical values are $x = -2$ and $x = 3$.

The graph of $y = (x-3)(x+2)$ is an upward parabola (since $a=1>0$) crossing the $x$-axis at $x=-2$ and $x=3$. It is **above** the axis (positive) outside the roots and **below** (negative) between them. We want $y > 0$, so:

$$
x < -2 \quad \text{or} \quad x > 3.
$$

*Check:* try $x=-3$ (outside, left): $(-3)^2-(-3)-6 = 9+3-6=6>0$. ✓ Try $x=0$ (between): $0-0-6=-6$, not $>0$, correctly excluded. ✓ Try $x=4$ (outside, right): $16-4-6=6>0$. ✓

::widget{type="function-grapher" expr="x^2 - x - 6" xmin=-6 xmax=6 ymin=-10 ymax=10 grid=true}

:::callout{kind="key"}
For an upward parabola $(x-p)(x-q)$ with $p<q$: the expression is **positive outside** the roots ($x<p$ or $x>q$) and **negative between** them ($p<x<q$). For a downward parabola, it's the other way round. Sketching (or a sign diagram) beats memorising — always check a test point in each region.
:::

**Example (between the roots).** Solve $x^2 \leq 9$.

Rearrange: $x^2 - 9 \leq 0$, i.e. $(x-3)(x+3) \leq 0$. Critical values $x = \pm 3$. This is an upward parabola, so it is $\leq 0$ **between** (and including) the roots:

$$
-3 \leq x \leq 3.
$$

*Check:* $x=0$: $0 \leq 9$. ✓ $x=3$: $9\leq 9$. ✓ (boundary included, since $\leq$) $x=4$: $16 \leq 9$ is false, correctly excluded. ✓

:::reveal{title="Worked example: a ≠ 1"}
Solve $2x^2 - 5x - 3 < 0$.

Factorise: $2x^2-5x-3 = (2x+1)(x-3)$. Setting each factor to zero: $x = -\tfrac12$ or $x = 3$.

This is an upward parabola ($a=2>0$), so it is negative **between** the roots:

$$
-\tfrac{1}{2} < x < 3.
$$

*Check:* $x=0$ (between): $2(0)-5(0)-3=-3<0$. ✓ $x=-1$ (outside): $2(1)-5(-1)-3 = 2+5-3=4$, not $<0$, correctly excluded. ✓ $x=4$ (outside): $2(16)-20-3=9$, not $<0$, correctly excluded. ✓
:::

## Simultaneous equations: one linear, one quadratic

When one equation is linear and the other is quadratic, **substitute the linear equation into the quadratic one** to reduce to a single quadratic in one variable, then solve as usual.

**Example.** Solve simultaneously: $y = x + 1$ and $y = x^2 - 5$.

Since both equal $y$, set them equal:

$$
x + 1 = x^2 - 5 \implies x^2 - x - 6 = 0 \implies (x-3)(x+2) = 0,
$$

so $x = 3$ or $x = -2$. Substitute back into $y = x+1$ (the linear equation, easier to use):

- $x = 3 \Rightarrow y = 4$
- $x = -2 \Rightarrow y = -1$

So the solutions are $(3, 4)$ and $(-2, -1)$.

*Check in both original equations:* $(3,4)$: $y=x+1 \Rightarrow 4=3+1$ ✓; $y=x^2-5 \Rightarrow 4 = 9-5=4$ ✓. $(-2,-1)$: $y=x+1 \Rightarrow -1=-2+1$ ✓; $y=x^2-5 \Rightarrow -1 = 4-5=-1$ ✓.

Geometrically, these are the two points where the line $y=x+1$ crosses the parabola $y=x^2-5$.

:::reveal{title="Worked example: a tangent case (discriminant = 0)"}
Solve simultaneously: $y = 2x - 1$ and $y = x^2 - 4x + 7$.

$$
2x - 1 = x^2 - 4x + 7 \implies x^2 - 6x + 8 = 0 \implies (x-2)(x-4)=0,
$$

so $x=2$ or $x=4$, giving $y=2(2)-1=3$ and $y=2(4)-1=7$. Solutions: $(2,3)$ and $(4,7)$.

*Check:* $(2,3)$ on $y=x^2-4x+7$: $4-8+7=3$ ✓. $(4,7)$: $16-16+7=7$ ✓.

If instead the discriminant of the resulting quadratic is zero, the line is a **tangent** to the curve (exactly one intersection point); if negative, the line does not meet the curve at all.
:::

:::callout{kind="tip"}
Always substitute the linear equation into the quadratic one (not the other way round) — this keeps the algebra to a single quadratic in one unknown, which you can then solve by any of the three methods from Lesson 1.
:::
