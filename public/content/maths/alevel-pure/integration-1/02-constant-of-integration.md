# Finding the constant of integration

An indefinite integral $\int f(x)\,\mathrm{d}x = F(x) + C$ describes an entire **family** of curves, one for every value of $C$. Each member of the family has exactly the same gradient function $f(x)$ — the curves are vertical translations of one another. If we are told one point that the curve passes through, we can pick out the single curve we want by solving for $C$.

:::callout{kind="key"}
To find $C$: integrate to get $y = F(x) + C$, substitute the given point $(x_0, y_0)$, then solve the resulting equation for $C$.
:::

## Worked example

A curve has gradient function $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 6x^2 - 4x$ and passes through the point $(1, 5)$. Find $y$ in terms of $x$.

**Step 1 — integrate.**

$$
y = \int (6x^2 - 4x) \, \mathrm{d}x = \frac{6}{3}x^3 - \frac{4}{2}x^2 + C = 2x^3 - 2x^2 + C.
$$

**Step 2 — substitute the point $(1, 5)$.**

$$
5 = 2(1)^3 - 2(1)^2 + C = 2 - 2 + C = C.
$$

So $C = 5$, and the curve is

$$
y = 2x^3 - 2x^2 + 5.
$$

**Step 3 — check by differentiating back.** Differentiating $y = 2x^3 - 2x^2 + 5$ gives $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 6x^2 - 4x$, which matches the gradient function we started from — and $y(1) = 2 - 2 + 5 = 5$, matching the given point. Both checks confirm the answer.

## Why this matters

Without the extra condition, $\int (6x^2 - 4x)\,\mathrm{d}x$ only tells us the *shape* of the curve, not its exact vertical position. The condition (a point, or sometimes a physical fact such as "starts at rest") fixes that position uniquely.

:::callout{kind="tip"}
Always substitute the point into the integrated function (with $+C$ still present), not into the original gradient function. The gradient function has no $C$ to solve for.
:::

The curves $y = x^3$, $y = x^3 + 2$, and $y = x^3 - 3$ all share the gradient function $3x^2$ — they are the same shape shifted up or down. The grapher below shows one member of such a family; imagine sliding the whole curve vertically to picture the others.

::widget{type="function-grapher" expr="x^3 - 2x" xmin=-3 xmax=3}

:::reveal{title="Worked example: a curve through the origin"}
A curve has gradient function $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 3x^2 + 2$ and passes through $(0, 4)$. Find $y$.

Integrating:

$$
y = \int (3x^2 + 2)\, \mathrm{d}x = x^3 + 2x + C.
$$

Substituting $(0, 4)$:

$$
4 = (0)^3 + 2(0) + C \implies C = 4.
$$

So $y = x^3 + 2x + 4$.

**Differentiate-back check:** $\dfrac{\mathrm{d}}{\mathrm{d}x}(x^3 + 2x + 4) = 3x^2 + 2$, which matches the given gradient function, and $y(0) = 4$ as required.
:::

## Practice

Try applying the method yourself: integrate the gradient function, substitute the given point, and solve for $C$ — then differentiate your answer to check it. When ready, move on to definite integrals, where instead of finding $C$ we use it to measure an actual numerical area.
