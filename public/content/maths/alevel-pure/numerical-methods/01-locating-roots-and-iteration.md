# Locating roots and fixed-point iteration

Many equations $f(x) = 0$ cannot be solved exactly using algebra. **Numerical methods** find approximate solutions to any required accuracy instead. This module covers three such methods and one numerical technique for integration.

## Change of sign

If $f$ is a **continuous** function and $f(a)$ and $f(b)$ have opposite signs, then the graph of $y = f(x)$ must cross the $x$-axis somewhere between $a$ and $b$. So there is a root $\alpha$ with $a < \alpha < b$.

:::callout{kind="key"}
If $f$ is continuous on $[a, b]$ and $f(a)$ and $f(b)$ have opposite signs, a root of $f(x) = 0$ lies in the interval $(a, b)$.
:::

This is only a **sufficient**, not necessary, condition: a root can exist without a sign change (e.g. a repeated root where the curve touches the axis), and the test says nothing if $f$ is discontinuous on $[a,b]$.

### Example

Let $f(x) = x^3 - x - 2$.

$$
f(1) = 1 - 1 - 2 = -2, \qquad f(2) = 8 - 2 - 2 = 4.
$$

Since $f(1) < 0$ and $f(2) > 0$, and $f$ is continuous (it's a polynomial), a root lies in $(1, 2)$.

::widget{type="function-grapher" expr="x^3 - x - 2" xmin=-2 xmax=3}

You can **narrow the interval** by repeated bisection: test the sign of $f$ at the midpoint and keep the half where the sign change occurs. For example $f(1.5) = 3.375 - 1.5 - 2 = -0.125 < 0$, so the root lies in $(1.5, 2)$ — a tighter bound.

## Fixed-point iteration

Rearrange $f(x) = 0$ into the form $x = g(x)$. Starting from an initial value $x_0$, generate a sequence using

$$
x_{n+1} = g(x_n).
$$

If the sequence **converges** (settles down to a limiting value $L$), then $L = g(L)$, so $L$ is a root of the original equation — a **fixed point** of $g$.

:::callout{kind="info"}
The same equation $f(x) = 0$ can often be rearranged into $x = g(x)$ in several different ways. Some rearrangements converge to the root; others diverge (run away from it), even from the same starting value.
:::

### Worked example: a converging rearrangement

Take $f(x) = x^3 - x - 2 = 0$ again (root near $1.52$, from above). Rearranging:

$$
x^3 = x + 2 \quad\Rightarrow\quad x = (x+2)^{1/3} = g(x).
$$

Starting from $x_0 = 1.5$:

:::reveal{title="Worked example: iterating x_(n+1) = (x_n + 2)^(1/3)"}
$$
x_1 = (1.5 + 2)^{1/3} = 3.5^{1/3} = 1.51829\ldots
$$

$$
x_2 = (1.51829\ldots + 2)^{1/3} = 3.51829\ldots^{1/3} = 1.52094\ldots
$$

$$
x_3 = (1.52094\ldots + 2)^{1/3} = 1.52132\ldots
$$

The values $1.5,\ 1.51829,\ 1.52094,\ 1.52132,\ldots$ are converging towards $\alpha \approx 1.5214$ (to 4 d.p.), which matches the root located by the sign-change argument above.
:::

### When does it diverge?

The **same** equation rearranged differently can diverge. Try $x^3 - x - 2 = 0$ as

$$
x = x^3 - 2 = g(x),
$$

starting again from $x_0 = 1.5$: $x_1 = 1.5^3 - 2 = 1.375$, $x_2 = 1.375^3 - 2 = -0.4004\ldots$, $x_3 = (-0.4004)^3 - 2 = -2.0642\ldots$ — the values shoot away from the root instead of towards it.

:::callout{kind="warning"}
A rearrangement $x = g(x)$ converges near a root $\alpha$ if $|g'(\alpha)| < 1$, and diverges if $|g'(\alpha)| > 1$. For $g(x) = (x+2)^{1/3}$, $g'(\alpha) \approx 0.14$ (converges); for $g(x) = x^3 - 2$, $g'(\alpha) \approx 6.94$ (diverges). You are not required to prove this, but it explains why some rearrangements work and others don't — a **cobweb** or **staircase** diagram (successive points $(x_n, x_n)$ and $(x_n, x_{n+1})$) shows the same behaviour visually.
:::

## Try it yourself

Run the code below to see fixed-point iteration converge numerically. It repeatedly applies $g(x) = (x+2)^{1/3}$ starting from $x_0 = 1.5$ and prints each iterate.

```python
def g(x):
    return (x + 2) ** (1 / 3)

x = 1.5
for n in range(6):
    x = g(x)
    print(n + 1, round(x, 6))
```

Edit the starter code below to change the starting value, or swap in `g(x) = x**3 - 2` to watch it diverge instead.

::widget{type="code-runner" language="python" starter="g = lambda x: (x + 2) ** (1 / 3); x = 1.5; xs = [x := g(x) for _ in range(6)]; print('iterates:', [round(v, 6) for v in xs])" solutionTest="assert abs(g(1.5213797068045676) - 1.5213797068045676) < 1e-6" rows=8}
