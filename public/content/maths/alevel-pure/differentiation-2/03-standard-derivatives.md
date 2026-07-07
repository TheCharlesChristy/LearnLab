# Standard derivatives and connected rates of change

Alongside polynomials, A-level pure mathematics uses a small set of **standard derivatives** for trigonometric, exponential and logarithmic functions. Combined with the chain rule, these let us differentiate a huge range of functions.

## The standard results

(Angles are always in **radians** when differentiating trigonometric functions.)

$$
\frac{\mathrm{d}}{\mathrm{d}x}(\sin x) = \cos x, \qquad
\frac{\mathrm{d}}{\mathrm{d}x}(\cos x) = -\sin x, \qquad
\frac{\mathrm{d}}{\mathrm{d}x}(\tan x) = \sec^2 x.
$$

$$
\frac{\mathrm{d}}{\mathrm{d}x}(e^x) = e^x, \qquad
\frac{\mathrm{d}}{\mathrm{d}x}(\ln x) = \frac{1}{x}.
$$

:::callout{kind="key"}
Memorise these five: $\sin x \to \cos x$; $\cos x \to -\sin x$ (note the minus sign); $\tan x \to \sec^2 x$; $e^x \to e^x$ (unchanged — the defining property of $e^x$); $\ln x \to \dfrac{1}{x}$.
:::

## Combining with the chain rule

For a composite argument, multiply by the derivative of the inside function, exactly as before:

$$
\frac{\mathrm{d}}{\mathrm{d}x}\big[\sin(g(x))\big] = \cos(g(x)) \cdot g'(x), \qquad
\frac{\mathrm{d}}{\mathrm{d}x}\big[e^{g(x)}\big] = e^{g(x)} \cdot g'(x), \qquad
\frac{\mathrm{d}}{\mathrm{d}x}\big[\ln(g(x))\big] = \frac{g'(x)}{g(x)}.
$$

### Worked example

Differentiate $y = \sin(3x^2)$.

Let $u = 3x^2$, so $y = \sin u$ and $u' = 6x$.

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \cos(u) \times 6x = 6x\cos(3x^2).
$$

### Worked example

Differentiate $y = e^{4x}$ and evaluate at $x = 0$.

Let $u = 4x$, so $y = e^u$ and $u' = 4$.

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = e^u \times 4 = 4e^{4x}.
$$

At $x = 0$: $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 4e^0 = 4$.

The plot below compares $y = e^x$ with its own derivative — since $\dfrac{\mathrm{d}}{\mathrm{d}x}(e^x) = e^x$, the tangent gradient at any point equals the height of the curve there.

::widget{type="function-grapher" expr="e^x" tangent=true xmin=-3 xmax=3}

:::reveal{title="Worked example: differentiate y = ln(5x - 2)"}
Let $u = 5x - 2$, so $y = \ln u$ and $u' = 5$.

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{u'}{u} = \frac{5}{5x - 2}.
$$

At $x = 1$: $\dfrac{\mathrm{d}y}{\mathrm{d}x} = \dfrac{5}{5(1)-2} = \dfrac{5}{3}$.
:::

## Connected rates of change

The chain rule also connects rates of change of different quantities. If $y$ depends on $u$, and $u$ in turn changes with time $t$, then

$$
\frac{\mathrm{d}y}{\mathrm{d}t} = \frac{\mathrm{d}y}{\mathrm{d}u} \times \frac{\mathrm{d}u}{\mathrm{d}t}.
$$

This is the same chain rule, just relabelled — it lets us relate "how fast $y$ changes with time" to "how fast $y$ changes with $u$" and "how fast $u$ changes with time".

### Worked example

A circular ripple spreads so that its radius $r$ (in cm) increases at a constant rate $\dfrac{\mathrm{d}r}{\mathrm{d}t} = 3\text{ cm s}^{-1}$. Find the rate at which the area $A = \pi r^2$ is increasing when $r = 10\text{ cm}$.

$$
\frac{\mathrm{d}A}{\mathrm{d}r} = 2\pi r.
$$

By the chain rule,

$$
\frac{\mathrm{d}A}{\mathrm{d}t} = \frac{\mathrm{d}A}{\mathrm{d}r} \times \frac{\mathrm{d}r}{\mathrm{d}t} = 2\pi r \times 3 = 6\pi r.
$$

At $r = 10$: $\dfrac{\mathrm{d}A}{\mathrm{d}t} = 6\pi(10) = 60\pi \approx 188.5\text{ cm}^2\text{s}^{-1}$.

:::callout{kind="tip"}
In a connected-rates problem, identify the two rates you are given/asked for, find a variable that links them (here, $r$), and write the chain rule as a product of the two derivatives that share that middle variable.
:::

## Summary table

| $f(x)$ | $f'(x)$ |
| --- | --- |
| $\sin x$ | $\cos x$ |
| $\cos x$ | $-\sin x$ |
| $\tan x$ | $\sec^2 x$ |
| $e^x$ | $e^x$ |
| $\ln x$ | $\dfrac{1}{x}$ |
| $\sin(g(x))$ | $g'(x)\cos(g(x))$ |
| $e^{g(x)}$ | $g'(x)e^{g(x)}$ |
| $\ln(g(x))$ | $\dfrac{g'(x)}{g(x)}$ |

With the chain, product and quotient rules, plus these standard derivatives, you can now differentiate almost any function you will meet at A-level. The final lesson uses all of this to locate and classify stationary points.
