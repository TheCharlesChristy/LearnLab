# Exponential functions and the number e

An **exponential function** has the variable in the power (the exponent), not the base:

$$
f(x) = a^x, \qquad a > 0, \ a \ne 1.
$$

This is fundamentally different from a power function like $x^2$, where the *base* varies and the power is fixed. Here the base $a$ is fixed and the power $x$ varies.

## Growth and decay

The shape of $y = a^x$ depends entirely on the base $a$:

- If $a > 1$, the function is **increasing** — this is **exponential growth**. Bigger $a$ means faster growth.
- If $0 < a < 1$, the function is **decreasing** — this is **exponential decay**.
- Every curve $y = a^x$ passes through $(0, 1)$, because $a^0 = 1$ for any valid $a$.
- $a^x > 0$ for all $x$ — an exponential function never touches or crosses the $x$-axis. The $x$-axis ($y=0$) is a horizontal asymptote.

Use the grapher below to compare growth ($a=2$) against decay ($a=0.5$): change the expression to try other bases such as `3^x` or `0.2^x`.

::widget{type="function-grapher" expr="2^x" xmin=-4 xmax=4 ymin=0 ymax=16}

:::callout{kind="info"}
Because $a^x>0$ always, an equation like $a^x = -3$ has **no solution** — this fact is used constantly when solving exponential equations later in this module.
:::

## The special number e

Among all possible bases, one is mathematically special: $e \approx 2.71828\ldots$, an irrational number (like $\pi$). It arises naturally as the limit

$$
e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n,
$$

and — the property that makes it indispensable in calculus — the function $f(x) = e^x$ is **its own derivative**: $f'(x) = e^x$. No other base has this property without an extra constant factor. For this reason $e^x$ (sometimes written $\exp(x)$) is called *the* exponential function, and it is the default base for continuous growth and decay models later in this module.

::widget{type="function-grapher" expr="e^x" xmin=-3 xmax=3 ymin=0 ymax=20 grid=true}

:::reveal{title="Worked example: comparing exponential expressions"}
**Question.** Without a calculator, decide which is larger: $2^{10}$ or $10^2$.

Compute each:

$$
2^{10} = 1024, \qquad 10^2 = 100.
$$

So $2^{10} = 1024$ is much larger than $10^2 = 100$. This illustrates the key feature of exponential growth: for a fixed base $a>1$, $a^x$ eventually outgrows *any* fixed power $x^n$ as $x$ increases, no matter how large $n$ is.
:::

## Using a calculator value of e

For numerical work you will need a decimal approximation:

$$
e = 2.718281828\ldots
$$

To 4 decimal places, $e \approx 2.7183$. You can check some values of $e^x$ using the code cell below — try changing `x` to see how quickly $e^x$ grows.

::widget{type="code-runner" language="python" starter="import math\n\nx = 1\nprint('e^x =', math.exp(x))\nprint('e =', math.e)" rows=8}

:::callout{kind="key"}
$e^0 = 1$, $e^1 = e \approx 2.71828$, and as $x \to \infty$, $e^x \to \infty$; as $x \to -\infty$, $e^x \to 0^+$. The graph of $e^x$ sits between $y=2^x$ and $y=3^x$, since $2 < e < 3$.
:::

## Practice

Try the end-of-module assessment once you have worked through all three lessons — it covers exponentials, logs, and equations/models together.
