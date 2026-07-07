# The chain rule

So far every function we have differentiated has been a sum of powers of $x$, using the power rule from *Differentiation I*. Many useful functions are **composite** — one function applied to the output of another, such as $(3x+1)^5$ or $\sin(2x)$. The **chain rule** tells us how to differentiate these.

## Composite functions

A composite function $f(g(x))$ takes an "inner" function $g$ and an "outer" function $f$. For example, $y = (3x+1)^5$ is the outer function "raise to the power 5" applied to the inner function $g(x) = 3x + 1$.

## Statement of the rule

If $y = f(g(x))$, write $u = g(x)$ so that $y = f(u)$. Then

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{\mathrm{d}y}{\mathrm{d}u} \times \frac{\mathrm{d}u}{\mathrm{d}x}.
$$

In words: **differentiate the outer function with respect to the inner function, then multiply by the derivative of the inner function.**

:::callout{kind="key"}
Chain rule: if $y = f(g(x))$ then $\dfrac{\mathrm{d}y}{\mathrm{d}x} = f'(g(x)) \times g'(x)$. Equivalently, with $u = g(x)$, $\dfrac{\mathrm{d}y}{\mathrm{d}x} = \dfrac{\mathrm{d}y}{\mathrm{d}u}\cdot\dfrac{\mathrm{d}u}{\mathrm{d}x}$.
:::

## Worked example

Differentiate $y = (3x + 1)^5$.

Let $u = 3x + 1$, so $y = u^5$.

$$
\frac{\mathrm{d}y}{\mathrm{d}u} = 5u^4, \qquad \frac{\mathrm{d}u}{\mathrm{d}x} = 3.
$$

By the chain rule,

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = 5u^4 \times 3 = 15u^4 = 15(3x+1)^4.
$$

## A shortcut for $(ax+b)^n$

The pattern above happens often enough to remember directly:

$$
\frac{\mathrm{d}}{\mathrm{d}x}\big[(ax+b)^n\big] = an(ax+b)^{n-1}.
$$

This is exactly the power rule with the "reduce the power, multiply by it" step, followed by multiplying by the derivative of the bracket ($a$).

The graph below shows $y = (x+1)^2$ (equivalent to $x^2$ shifted) together with its tangent; drag the point and compare the gradient reading with $2(x+1)$, the chain-rule result.

::widget{type="function-grapher" expr="(x+1)^2" tangent=true xmin=-4 xmax=4}

:::reveal{title="Worked example: differentiate y = (2x^2 - 3)^4"}
Let $u = 2x^2 - 3$, so $y = u^4$.

$$
\frac{\mathrm{d}y}{\mathrm{d}u} = 4u^3, \qquad \frac{\mathrm{d}u}{\mathrm{d}x} = 4x.
$$

By the chain rule,

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = 4u^3 \times 4x = 16x(2x^2-3)^3.
$$

To check at $x = 2$: $u = 2(4) - 3 = 5$, so $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 16(2)(5)^3 = 32 \times 125 = 4000$.
:::

## Practice pattern

For $y = \big(g(x)\big)^n$, the chain rule always gives

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = n\big(g(x)\big)^{n-1} \times g'(x).
$$

Spot the "inner" function, differentiate it, and multiply by the "outer" power rule result. This pattern recurs throughout the rest of the module — including inside the product and quotient rules in the next lesson, and applied to trigonometric and exponential functions later on.
