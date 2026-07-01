# Integration as reverse differentiation

You have seen that if $f(x) = ax^n$ then $f'(x) = anx^{n-1}$ — the power rule. **Integration** asks the opposite question: given a derivative, what function did it come from?

## Undoing the power rule

Suppose we know $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 2x$. We want a function $y$ whose derivative is $2x$. Since differentiating $x^2$ gives $2x$, one answer is $y = x^2$. But $y = x^2 + 5$ also differentiates to $2x$, because a constant differentiates to $0$. In fact **any** function of the form $y = x^2 + C$, for a constant $C$, has derivative $2x$.

:::callout{kind="key"}
Integration reverses differentiation. Because constants vanish under differentiation, undoing the process can never tell us which constant was there originally — so we must always add an unknown constant $C$, called the **constant of integration**.
:::

## The rule for integrating $ax^n$

Reversing the power rule term by term gives the general rule (for $n \neq -1$):

$$
\int a x^n \, \mathrm{d}x = \frac{a}{n+1} x^{n+1} + C.
$$

In words: **raise the power by one, then divide by the new power.** This is exactly the opposite of the power rule, which multiplies by the old power and lowers it by one.

:::callout{kind="info"}
The restriction $n \neq -1$ is because dividing by $n + 1$ would mean dividing by zero when $n = -1$. Integrating $x^{-1} = \frac{1}{x}$ needs a different rule (logarithms), which is outside this module.
:::

## Worked examples

| $f(x)$ | $\int f(x)\,\mathrm{d}x$ |
| --- | --- |
| $x^3$ | $\dfrac{x^4}{4} + C$ |
| $5x^2$ | $\dfrac{5x^3}{3} + C$ |
| $4$ (i.e. $4x^0$) | $4x + C$ |
| $6x^3 - 2x + 3$ | $\dfrac{6x^4}{4} - \dfrac{2x^2}{2} + 3x + C = \dfrac{3x^4}{2} - x^2 + 3x + C$ |

Just like differentiation, integration is **linear**: integrate a sum term by term, and constant multiples carry straight through.

The grapher below shows the curve $y = x^2$, whose gradient function is $2x$ — the same curve that appears when we integrate $2x$ back up. Explore how the curve rises across the plotted range.

::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}

:::reveal{title="Worked example: integrate 3x^4 - 5x^2 + 2"}
Integrate term by term using $\displaystyle\int ax^n\,\mathrm{d}x = \frac{a}{n+1}x^{n+1} + C$:

$$
\int (3x^4 - 5x^2 + 2) \, \mathrm{d}x = \frac{3}{5}x^5 - \frac{5}{3}x^3 + 2x + C.
$$

**Check by differentiating back** (the standard self-check for integration): differentiate the answer using the power rule term by term:

$$
\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{3}{5}x^5 - \frac{5}{3}x^3 + 2x + C\right) = \frac{3}{5}\cdot 5x^4 - \frac{5}{3}\cdot 3x^2 + 2 = 3x^4 - 5x^2 + 2.
$$

This matches the original integrand exactly, so the integral is correct.
:::

In the next lesson we see how extra information — a point the curve passes through — lets us pin down the exact value of $C$.
