# Definite integrals and the area under a curve

So far every integral has carried an unknown constant $C$. A **definite integral** evaluates the antiderivative at two specific $x$-values and subtracts, so $C$ cancels out completely — leaving a single number.

## Evaluating a definite integral

For $f(x)$ with antiderivative $F(x)$ (so $F'(x) = f(x)$), the definite integral from $x = a$ to $x = b$ is

$$
\int_a^b f(x) \, \mathrm{d}x = \Big[F(x)\Big]_a^b = F(b) - F(a).
$$

Because $F(x) + C$ evaluated at $b$ minus the same expression evaluated at $a$ always removes the $C$, we can simply drop it when doing definite integrals.

:::callout{kind="key"}
$\displaystyle\int_a^b f(x)\,\mathrm{d}x = F(b) - F(a)$, where $F$ is any antiderivative of $f$. The constant of integration is not needed here because it cancels.
:::

## Worked example

Evaluate $\displaystyle\int_1^3 (2x + 1) \, \mathrm{d}x$.

$$
\int (2x+1)\,\mathrm{d}x = x^2 + x \quad (\text{antiderivative, } C \text{ omitted since it will cancel}).
$$

$$
\int_1^3 (2x+1)\,\mathrm{d}x = \Big[x^2 + x\Big]_1^3 = (3^2 + 3) - (1^2 + 1) = 12 - 2 = 10.
$$

**Check by differentiating back:** $\dfrac{\mathrm{d}}{\mathrm{d}x}(x^2 + x) = 2x + 1$, which matches the integrand, confirming the antiderivative used was correct.

## The link with area

If $f(x) \geq 0$ on the interval $[a, b]$ — that is, the curve lies on or above the $x$-axis — then $\displaystyle\int_a^b f(x)\,\mathrm{d}x$ equals the **area** of the region enclosed between the curve $y = f(x)$, the $x$-axis, and the vertical lines $x = a$ and $x = b$.

The plot below shows $y = x^2$. The area under this curve between $x = 1$ and $x = 3$ (the shape bounded above by the curve, below by the $x$-axis, and at the sides by $x=1$ and $x=3$) is exactly the value of $\int_1^3 x^2 \, \mathrm{d}x$.

::widget{type="function-grapher" expr="x^2" xmin=0 xmax=4 grid=true}

:::callout{kind="info"}
Picture the region under the curve between $x=1$ and $x=3$ on the plot above: it is bounded above by $y = x^2$, below by the $x$-axis, and on the sides by the two vertical lines. Definite integration finds this area exactly, without needing to draw or measure anything.
:::

## Worked example: area under a curve

Find the area between the curve $y = x^2$, the $x$-axis, and the lines $x = 1$ and $x = 3$.

$$
\text{Area} = \int_1^3 x^2 \, \mathrm{d}x = \left[\frac{x^3}{3}\right]_1^3 = \frac{27}{3} - \frac{1}{3} = 9 - \frac{1}{3} = \frac{26}{3}.
$$

**Check by differentiating back:** $\dfrac{\mathrm{d}}{\mathrm{d}x}\left(\dfrac{x^3}{3}\right) = x^2$, which matches the integrand $x^2$, so the antiderivative is correct. So the area is $\dfrac{26}{3}$ square units (exactly $8.\overline{6}$).

:::reveal{title="Worked example: area under a cubic-linear curve"}
Find the area between $y = 3x^2 - 2x + 1$, the $x$-axis, and the lines $x = 0$ and $x = 2$. Since $3x^2 - 2x + 1 > 0$ for all $x$ (check: its minimum value is positive), the curve lies above the $x$-axis on $[0, 2]$, so the definite integral gives the area directly.

$$
\int_0^2 (3x^2 - 2x + 1)\,\mathrm{d}x = \Big[x^3 - x^2 + x\Big]_0^2 = (8 - 4 + 2) - (0 - 0 + 0) = 6.
$$

**Differentiate-back check:** $\dfrac{\mathrm{d}}{\mathrm{d}x}(x^3 - x^2 + x) = 3x^2 - 2x + 1$, matching the integrand. So the area is $6$ square units.
:::

## Summary

- $\int a x^n \, \mathrm{d}x = \dfrac{a}{n+1}x^{n+1} + C$ for $n \neq -1$ (indefinite integral — a family of curves).
- A given point on the curve fixes $C$ uniquely.
- $\int_a^b f(x)\,\mathrm{d}x = F(b) - F(a)$ (definite integral — a single number, $C$ cancels).
- When $f(x) \geq 0$ on $[a,b]$, this number is the area between the curve and the $x$-axis from $x=a$ to $x=b$.
- Always differentiate your antiderivative back to check it reproduces the original integrand — this catches almost every algebra slip.

When you are ready, attempt the end-of-module assessment.
