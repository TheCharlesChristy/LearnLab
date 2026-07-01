# The trapezium rule

Not every function can be integrated exactly using the techniques from *Integration I*. The **trapezium rule** approximates a definite integral $\displaystyle\int_a^b f(x)\,\mathrm{d}x$ — the exact area under $y = f(x)$ between $x=a$ and $x=b$ — by splitting the region into strips and approximating each strip as a trapezium instead of finding the exact area.

## Setting up the rule

Divide $[a, b]$ into $n$ **equal-width strips**, each of width

$$
h = \frac{b - a}{n}.
$$

This gives $n+1$ ordinates (function values) $y_0, y_1, \ldots, y_n$ at $x_0 = a, x_1 = a+h, \ldots, x_n = b$. Each strip is approximated by a trapezium with parallel sides $y_{i}$ and $y_{i+1}$ and width $h$, with area $\frac{h}{2}(y_i + y_{i+1})$. Summing all $n$ strips and collecting terms:

$$
\int_a^b f(x)\,\mathrm{d}x \approx \frac{h}{2}\Big[y_0 + y_n + 2(y_1 + y_2 + \cdots + y_{n-1})\Big].
$$

:::callout{kind="key"}
Trapezium rule with $n$ strips of width $h = \dfrac{b-a}{n}$:
$$
\int_a^b f(x)\,\mathrm{d}x \approx \frac{h}{2}\big[(y_0 + y_n) + 2(y_1 + \cdots + y_{n-1})\big].
$$
The **end** ordinates $y_0, y_n$ are counted once; every ordinate **strictly between** them is counted twice (it is shared by two adjacent trapezia).
:::

More strips (smaller $h$) generally give a better approximation to the exact integral — compare with *Integration I*, which finds such areas exactly wherever an antiderivative can be found in closed form.

## Worked example

Estimate $\displaystyle\int_0^4 x^2\,\mathrm{d}x$ using the trapezium rule with $n = 4$ strips.

:::reveal{title="Worked example: trapezium rule with 4 strips"}
Here $a=0$, $b=4$, $n=4$, so $h = \dfrac{4-0}{4} = 1$. The ordinates are at $x = 0, 1, 2, 3, 4$:

| $x$ | $0$ | $1$ | $2$ | $3$ | $4$ |
| --- | --- | --- | --- | --- | --- |
| $y = x^2$ | $0$ | $1$ | $4$ | $9$ | $16$ |

$$
\int_0^4 x^2\,\mathrm{d}x \approx \frac{1}{2}\Big[(0 + 16) + 2(1 + 4 + 9)\Big] = \frac{1}{2}\big[16 + 28\big] = \frac{44}{2} = 22.
$$

Compare with the exact value using *Integration I*: $\displaystyle\int_0^4 x^2\,\mathrm{d}x = \Big[\frac{x^3}{3}\Big]_0^4 = \frac{64}{3} = 21.\overline{3}$. The trapezium rule slightly **overestimates** here, because $y=x^2$ is convex (curves upward), so each chord lies above the curve.
:::

::widget{type="function-grapher" expr="x^2" xmin=-1 xmax=5 ymin=-1 ymax=18}

:::callout{kind="tip"}
The trapezium rule **overestimates** the integral of a convex curve (one that bends upward, like $x^2$) and **underestimates** the integral of a concave curve (one that bends downward), because a straight chord lies on the outside of the bend in each case.
:::

## A second worked example

Estimate $\displaystyle\int_1^3 \frac{1}{x}\,\mathrm{d}x$ using the trapezium rule with $n = 4$ strips.

:::reveal{title="Worked example: trapezium rule for 1/x"}
$a=1$, $b=3$, $n=4$, so $h = \dfrac{3-1}{4} = 0.5$. Ordinates at $x = 1, 1.5, 2, 2.5, 3$:

| $x$ | $1$ | $1.5$ | $2$ | $2.5$ | $3$ |
| --- | --- | --- | --- | --- | --- |
| $y = 1/x$ | $1$ | $0.6667$ | $0.5$ | $0.4$ | $0.3333$ |

$$
\int_1^3 \frac{1}{x}\,\mathrm{d}x \approx \frac{0.5}{2}\Big[(1 + 0.3333) + 2(0.6667 + 0.5 + 0.4)\Big] = 0.25\big[1.3333 + 3.1334\big] = 0.25 \times 4.4667 = 1.1167 \text{ (4 d.p.)}
$$

The exact value is $\ln 3 \approx 1.0986$, so the trapezium estimate overestimates slightly, again because $y = 1/x$ is convex for $x > 0$.
:::

## Try it yourself

The code below computes the trapezium-rule estimate for $\displaystyle\int_0^4 x^2\,\mathrm{d}x$ with $n=4$ strips — check that it prints $22.0$, matching the worked example.

```python
def f(x):
    return x ** 2

a, b, n = 0, 4, 4
h = (b - a) / n
xs = [a + i * h for i in range(n + 1)]
ys = [f(x) for x in xs]
estimate = h / 2 * (ys[0] + ys[-1] + 2 * sum(ys[1:-1]))
print(round(estimate, 4))
```

::widget{type="code-runner" language="python" starter="f = lambda x: x**2; a, b, n = 0, 4, 4; h = (b - a) / n; xs = [a + i * h for i in range(n + 1)]; ys = [f(x) for x in xs]; estimate = h / 2 * (ys[0] + ys[-1] + 2 * sum(ys[1:-1])); print('estimate:', round(estimate, 4))" solutionTest="assert abs(estimate - 22.0) < 1e-9" rows=8}

## Summary

- A **change of sign** of a continuous $f$ across $[a,b]$ locates a root in $(a,b)$.
- **Fixed-point iteration** rearranges $f(x)=0$ as $x=g(x)$ and iterates $x_{n+1}=g(x_n)$; convergence depends on the rearrangement chosen.
- **Newton-Raphson**, $x_{n+1} = x_n - \dfrac{f(x_n)}{f'(x_n)}$, uses the derivative and usually converges faster, but needs a good starting value and $f'(x_n) \ne 0$.
- The **trapezium rule** approximates $\displaystyle\int_a^b f(x)\,\mathrm{d}x$ by summing trapezia across $n$ strips of width $h=\frac{b-a}{n}$.

When you are ready, attempt the end-of-module assessment.
