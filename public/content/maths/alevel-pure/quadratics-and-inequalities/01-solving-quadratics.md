# Solving quadratics three ways

A **quadratic equation** has the form

$$
ax^2 + bx + c = 0, \qquad a \neq 0.
$$

There are three standard methods for solving it: **factorising**, **completing the square**, and the **quadratic formula**. Each has its place — factorising is fastest when it works, completing the square always works and reveals the turning point, and the quadratic formula always works and is the method of last resort (or first resort, if you just want an answer quickly).

## Method 1: factorising

To factorise $x^2 + bx + c$ (with $a = 1$), find two numbers that multiply to $c$ and add to $b$.

**Example.** Solve $x^2 - x - 6 = 0$.

We need two numbers multiplying to $-6$ and adding to $-1$: these are $-3$ and $2$. So

$$
x^2 - x - 6 = (x - 3)(x + 2) = 0.
$$

Either factor can be zero, so $x = 3$ or $x = -2$.

*Check:* $3^2 - 3 - 6 = 9 - 3 - 6 = 0$. ✓ &nbsp; $(-2)^2 - (-2) - 6 = 4 + 2 - 6 = 0$. ✓

When $a \neq 1$, factorise by finding factors of $ac$ that add to $b$, then split the middle term.

:::reveal{title="Worked example: factorising with a ≠ 1"}
Solve $2x^2 + 5x - 3 = 0$.

Here $a = 2$, $b = 5$, $c = -3$, so $ac = -6$. We need two numbers multiplying to $-6$ and adding to $5$: these are $6$ and $-1$.

$$
2x^2 + 6x - x - 3 = 0 \implies 2x(x+3) - 1(x+3) = 0 \implies (2x - 1)(x + 3) = 0.
$$

So $x = \tfrac{1}{2}$ or $x = -3$.

*Check:* $2(\tfrac12)^2 + 5(\tfrac12) - 3 = \tfrac12 + \tfrac52 - 3 = 3 - 3 = 0$. ✓ &nbsp; $2(-3)^2 + 5(-3) - 3 = 18 - 15 - 3 = 0$. ✓
:::

## Method 2: completing the square

Every quadratic $ax^2 + bx + c$ can be rewritten in **completed-square form** $a(x + p)^2 + q$. For $a = 1$:

$$
x^2 + bx + c = \left(x + \frac{b}{2}\right)^2 - \frac{b^2}{4} + c.
$$

**Example.** Solve $x^2 + 6x + 4 = 0$ by completing the square.

$$
x^2 + 6x + 4 = (x+3)^2 - 9 + 4 = (x+3)^2 - 5 = 0.
$$

So $(x+3)^2 = 5$, giving $x + 3 = \pm\sqrt{5}$, hence

$$
x = -3 \pm \sqrt{5}.
$$

These are **surd-form** roots — exact answers rather than decimals, as you met when working with $\sqrt{5}$ and other surds.

:::callout{kind="tip"}
Completing the square is the method that *always* reveals the turning point directly: $x^2 + 6x + 4 = (x+3)^2 - 5$ has a minimum at $(-3, -5)$, since $(x+3)^2 \geq 0$ with equality when $x = -3$. This connects directly to sketching graphs in the next lesson.
:::

## Method 3: the quadratic formula

Completing the square on the general equation $ax^2 + bx + c = 0$ gives the **quadratic formula**:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}.
$$

This works for *any* quadratic, including those that don't factorise nicely.

**Example.** Solve $2x^2 - 3x - 4 = 0$.

Here $a = 2$, $b = -3$, $c = -4$.

$$
x = \frac{-(-3) \pm \sqrt{(-3)^2 - 4(2)(-4)}}{2(2)} = \frac{3 \pm \sqrt{9 + 32}}{4} = \frac{3 \pm \sqrt{41}}{4}.
$$

Since $41$ has no square factors, $\sqrt{41}$ cannot be simplified further, so the exact roots are $x = \dfrac{3 + \sqrt{41}}{4}$ and $x = \dfrac{3 - \sqrt{41}}{4}$.

:::reveal{title="Worked example: a surd simplifies"}
Solve $x^2 - 2x - 4 = 0$ using the quadratic formula.

$$
x = \frac{-(-2) \pm \sqrt{(-2)^2 - 4(1)(-4)}}{2(1)} = \frac{2 \pm \sqrt{4 + 16}}{2} = \frac{2 \pm \sqrt{20}}{2}.
$$

Since $\sqrt{20} = \sqrt{4 \times 5} = 2\sqrt{5}$, this simplifies:

$$
x = \frac{2 \pm 2\sqrt{5}}{2} = 1 \pm \sqrt{5}.
$$

*Check (approximately):* $\sqrt{5} \approx 2.236$, so $x \approx 3.236$ or $x \approx -1.236$. Substituting $x \approx 3.236$: $x^2 - 2x - 4 \approx 10.47 - 6.47 - 4 = 0.00$. ✓
:::

Use the widget below to explore the graph of $y = x^2 - x - 6$ and see how its roots ($x = -2$ and $x = 3$) are exactly where the curve crosses the $x$-axis.

::widget{type="function-grapher" expr="x^2 - x - 6" xmin=-6 xmax=6 tangent=false grid=true}

:::callout{kind="key"}
The roots of $ax^2+bx+c=0$ are the $x$-intercepts of the graph $y = ax^2+bx+c$. Factorising, completing the square and the quadratic formula are three routes to the same roots — always check your answer by substituting back in.
:::
