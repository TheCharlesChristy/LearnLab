# Differentiation from first principles

In the previous lesson we estimated a gradient using chords and let the second point slide closer and closer. Making that limiting process exact gives the **derivative**.

## The limit definition

For a function $f(x)$, the derivative $f'(x)$ is defined as

$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}.
$$

The fraction is the gradient of the chord joining $(x, f(x))$ to $(x+h, f(x+h))$. The limit as $h \to 0$ is the gradient of the tangent — the gradient of the curve at $x$.

:::callout{kind="key"}
$f'(x)$ is the limit of the chord gradient as the two points come together. We may write the derivative as $f'(x)$ or as $\dfrac{\mathrm{d}y}{\mathrm{d}x}$.
:::

## Example: differentiating $x^2$

Let $f(x) = x^2$. Then

$$
\frac{f(x+h) - f(x)}{h} = \frac{(x+h)^2 - x^2}{h} = \frac{x^2 + 2xh + h^2 - x^2}{h} = \frac{2xh + h^2}{h} = 2x + h.
$$

Taking the limit as $h \to 0$ removes the $h$ term, leaving

$$
f'(x) = 2x.
$$

This confirms the earlier results: at $x = 1$ the gradient is $2$, and at $x = 2$ the gradient is $4$.

The grapher below shows $y = x^2$ with a movable tangent. Check that the gradient readout equals $2x$ at the point you choose.

::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}

## Why the $h$ disappears

Before taking the limit we must simplify so that the $h$ in the denominator cancels. We can only set $h = 0$ *after* cancelling, because $\frac{0}{0}$ is undefined. The algebra of cancelling first, then letting $h \to 0$, is the heart of the method.

:::reveal{title="Worked example: differentiate f(x) = x^3 from first principles"}
With $f(x) = x^3$,

$$
\frac{(x+h)^3 - x^3}{h} = \frac{x^3 + 3x^2 h + 3x h^2 + h^3 - x^3}{h} = \frac{3x^2 h + 3x h^2 + h^3}{h}.
$$

Cancel the common factor $h$:

$$
= 3x^2 + 3xh + h^2.
$$

Now let $h \to 0$; the last two terms vanish, leaving

$$
f'(x) = 3x^2.
$$

So the gradient of $y = x^3$ at any point is $3x^2$ — for instance, $f'(2) = 12$.
:::

First principles always works, but it is laborious. In the next lesson we package the pattern we are seeing into a single rule: the **power rule**.
