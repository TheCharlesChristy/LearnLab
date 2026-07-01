# The Newton-Raphson method

Fixed-point iteration needs a rearrangement $x = g(x)$ that happens to converge, which can be hit-or-miss. The **Newton-Raphson method** builds a rearrangement directly from $f$ and its derivative, and (near a root, for well-behaved $f$) usually converges very fast.

## The formula

Starting from an estimate $x_n$, the tangent to $y = f(x)$ at $x_n$ crosses the $x$-axis at a **better** estimate $x_{n+1}$:

$$
x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.
$$

:::callout{kind="key"}
Newton-Raphson: $x_{n+1} = x_n - \dfrac{f(x_n)}{f'(x_n)}$. You need $f'(x)$, so this method requires $f$ to be differentiable near the root (see *Differentiation II* for finding $f'(x)$ for a wider range of functions).
:::

### Why the formula works

The tangent to $y = f(x)$ at $(x_n, f(x_n))$ has gradient $f'(x_n)$, so its equation is

$$
y - f(x_n) = f'(x_n)(x - x_n).
$$

Setting $y = 0$ (where the tangent crosses the $x$-axis) and solving for $x$ gives $x = x_n - \dfrac{f(x_n)}{f'(x_n)}$ — this becomes the next estimate $x_{n+1}$.

::widget{type="function-grapher" expr="x^3 - x - 2" xmin=0 xmax=3 tangent=true}

Drag the tangent point above close to $x = 1.5$ to see how the tangent line's $x$-intercept lands close to the root near $x \approx 1.5214$.

## Worked example

Let $f(x) = x^3 - x - 2$, so $f'(x) = 3x^2 - 1$. Take $x_0 = 1.5$ (the same starting value used for fixed-point iteration in the previous lesson, for comparison).

:::reveal{title="Worked example: two iterations of Newton-Raphson"}
$$
f(1.5) = 1.5^3 - 1.5 - 2 = 3.375 - 1.5 - 2 = -0.125, \qquad f'(1.5) = 3(1.5)^2 - 1 = 6.75 - 1 = 5.75.
$$

$$
x_1 = 1.5 - \frac{-0.125}{5.75} = 1.5 + 0.021739\ldots = 1.521739 \text{ (6 d.p.)}
$$

Repeat with $x_1 = 1.521739$:

$$
f(x_1) = 1.521739^3 - 1.521739 - 2 = 0.002137\ldots, \qquad f'(x_1) = 3(1.521739)^2 - 1 = 5.947070\ldots
$$

$$
x_2 = 1.521739 - \frac{0.002137}{5.947070} = 1.521739 - 0.000359 = 1.521380 \text{ (6 d.p.)}
$$

Compare with fixed-point iteration in the previous lesson: after only **two** Newton-Raphson steps we already have $1.521380$, matching the converged value $\approx 1.5214$ to 4 decimal places — Newton-Raphson typically converges much faster once close to the root.
:::

## When Newton-Raphson goes wrong

Newton-Raphson can fail or converge to an unexpected root when:

- $f'(x_n) = 0$ (or is very close to $0$) — the tangent is horizontal or nearly so, so $x_{n+1}$ shoots far away or is undefined.
- The starting value $x_0$ is not close enough to the required root — the iteration may converge to a *different* root of $f$, or diverge.
- $f$ has a stationary point, discontinuity, or sharp turning point near $x_0$, so the tangent is a poor local approximation to the curve.

:::callout{kind="warning"}
Always sketch $y = f(x)$ (or reason about the sign change) first, so your starting value $x_0$ is a sensible estimate near the root you actually want.
:::

## Try it yourself

Run the code below. It applies Newton-Raphson to $f(x) = x^3 - x - 2$, $f'(x) = 3x^2 - 1$, from $x_0 = 1.5$, printing each iterate — check the first two values against the worked example above.

```python
def f(x):
    return x**3 - x - 2

def fprime(x):
    return 3 * x**2 - 1

x = 1.5
for n in range(5):
    x = x - f(x) / fprime(x)
    print(n + 1, round(x, 6))
```

::widget{type="code-runner" language="python" starter="f = lambda x: x**3 - x - 2; fp = lambda x: 3*x**2 - 1; x = 1.5; xs = [x := x - f(x) / fp(x) for _ in range(4)]; print('iterates:', [round(v, 6) for v in xs])" solutionTest="assert abs((1.5 - f(1.5)/fp(1.5)) - 1.521739) < 1e-4" rows=8}
