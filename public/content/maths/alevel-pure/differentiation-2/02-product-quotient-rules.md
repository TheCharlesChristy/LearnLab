# The product and quotient rules

Not every function is a simple composite. Many are a **product** of two simpler functions, such as $x^2(2x+1)^3$, or a **quotient**, such as $\dfrac{x}{x+1}$. These need their own rules.

## The product rule

If $y = uv$, where $u$ and $v$ are both functions of $x$, then

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = u'v + uv',
$$

where $u' = \dfrac{\mathrm{d}u}{\mathrm{d}x}$ and $v' = \dfrac{\mathrm{d}v}{\mathrm{d}x}$.

:::callout{kind="key"}
Product rule: $\dfrac{\mathrm{d}}{\mathrm{d}x}(uv) = u'v + uv'$ — "derivative of the first times the second, plus the first times the derivative of the second."
:::

### Worked example

Differentiate $y = x^2(2x+1)^3$.

Let $u = x^2$ and $v = (2x+1)^3$. Then

$$
u' = 2x, \qquad v' = 3(2x+1)^2 \times 2 = 6(2x+1)^2 \quad \text{(chain rule)}.
$$

By the product rule,

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = 2x(2x+1)^3 + x^2 \times 6(2x+1)^2 = 2x(2x+1)^3 + 6x^2(2x+1)^2.
$$

Factor out the common terms $2x(2x+1)^2$:

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = 2x(2x+1)^2\big[(2x+1) + 3x\big] = 2x(2x+1)^2(5x+1).
$$

## The quotient rule

If $y = \dfrac{u}{v}$, then

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{u'v - uv'}{v^2}.
$$

:::callout{kind="key"}
Quotient rule: $\dfrac{\mathrm{d}}{\mathrm{d}x}\left(\dfrac{u}{v}\right) = \dfrac{u'v - uv'}{v^2}$ — note the order in the numerator matters (it is *not* symmetric).
:::

### Worked example

Differentiate $y = \dfrac{x}{x+1}$.

Let $u = x$ and $v = x + 1$. Then $u' = 1$ and $v' = 1$.

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{(1)(x+1) - (x)(1)}{(x+1)^2} = \frac{x + 1 - x}{(x+1)^2} = \frac{1}{(x+1)^2}.
$$

Notice the numerator simplified nicely — this is common once you collect like terms.

The grapher below plots $y = \dfrac{x}{x+1}$; use the tangent tool to check the gradient at a chosen point against $\dfrac{1}{(x+1)^2}$ (always positive, matching the curve's steady rise on each branch).

::widget{type="function-grapher" expr="x/(x+1)" tangent=true xmin=-6 xmax=6}

:::reveal{title="Worked example: differentiate y = (2x - 1)/(x^2 + 3)"}
Let $u = 2x - 1$ and $v = x^2 + 3$, so $u' = 2$ and $v' = 2x$.

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{(2)(x^2+3) - (2x-1)(2x)}{(x^2+3)^2}.
$$

Expand the numerator carefully:

$$
2(x^2+3) = 2x^2 + 6, \qquad (2x-1)(2x) = 4x^2 - 2x.
$$

$$
\text{Numerator} = (2x^2 + 6) - (4x^2 - 2x) = 2x^2 + 6 - 4x^2 + 2x = -2x^2 + 2x + 6.
$$

So

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{-2x^2 + 2x + 6}{(x^2+3)^2}.
$$

Evaluating at $x = 0$: numerator $= 6$, denominator $= 9$, so $\dfrac{\mathrm{d}y}{\mathrm{d}x}\Big|_{x=0} = \dfrac{6}{9} = \dfrac{2}{3}$.
:::

## Choosing the right rule

- A **sum** of terms: differentiate term by term (power rule / chain rule on each term).
- A **product** of two factors that are each functions of $x$: product rule.
- A **quotient** of two functions of $x$: quotient rule.
- A single bracket raised to a power, or a function "inside" another: chain rule.

Often you need more than one rule together, as in the product-rule example above where the chain rule was needed to find $v'$.
