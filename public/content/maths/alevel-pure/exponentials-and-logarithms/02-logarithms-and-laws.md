# Logarithms and the laws of logs

## Logarithms as the inverse of exponentials

A **logarithm** answers the question "to what power must I raise the base to get this number?" Formally, for $a>0$, $a \ne 1$, and $x>0$:

$$
\log_a(x) = y \quad \Longleftrightarrow \quad a^y = x.
$$

So $\log_a$ and "raise $a$ to the power of" undo each other — they are **inverse functions**. Because $y = a^x$ only ever outputs positive numbers, $\log_a(x)$ is only defined for $x > 0$.

:::callout{kind="tip"}
A quick way to convert between the two forms: the base of the log becomes the base of the power, and the log's value becomes the exponent.
$\log_2(8) = 3$ means $2^3 = 8$. $\log_{10}(100)=2$ means $10^2=100$.
:::

Two special bases have their own notation:

- **Base 10**: $\log_{10}(x)$ is often written $\lg(x)$ or just $\log(x)$ on calculators.
- **Base $e$**: $\log_e(x)$ is written $\ln(x)$, the **natural logarithm** — the one used throughout calculus, because it is the inverse of $e^x$.

Some immediate consequences for any valid base $a$:

$$
\log_a(1) = 0 \quad (\text{since } a^0=1), \qquad \log_a(a) = 1 \quad (\text{since } a^1=a),
$$
$$
a^{\log_a(x)} = x, \qquad \log_a(a^x) = x.
$$

The graph of $y = \ln(x)$ is the reflection of $y = e^x$ in the line $y=x$ (as is true of any function and its inverse):

::widget{type="function-grapher" expr="log(x)" xmin=0.05 xmax=10 ymin=-4 ymax=3}

Notice: $\ln(x)$ is only defined for $x>0$, it passes through $(1,0)$ (since $\ln 1 = 0$), and it increases very slowly — this mirrors the fact that $e^x$ increases very quickly.

## The laws of logarithms

For $a>0$, $a\ne1$, and $A,B>0$, the laws of logs follow directly from the laws of indices:

| Law | Statement |
| --- | --- |
| Product law | $\log_a(AB) = \log_a A + \log_a B$ |
| Quotient law | $\log_a\!\left(\dfrac{A}{B}\right) = \log_a A - \log_a B$ |
| Power law | $\log_a(A^n) = n\log_a A$ |

Two useful special cases follow immediately from these:

$$
\log_a\!\left(\frac{1}{A}\right) = \log_a(A^{-1}) = -\log_a A, \qquad \log_a\left(\sqrt[n]{A}\right) = \log_a\!\left(A^{1/n}\right) = \frac{1}{n}\log_a A.
$$

:::callout{kind="key"}
The laws of logs mirror the laws of indices exactly: multiplying powers **adds** exponents ($a^m a^n = a^{m+n}$), so multiplying the *arguments* of a log **adds** the logs. This is why `indices-and-surds` is the essential prerequisite for this module.
:::

:::reveal{title="Worked example: applying the laws of logs"}
**Question.** Write $2\ln 3 + \ln 5 - \ln 15$ as a single logarithm, and simplify.

Apply the power law to the first term, then the product law, then the quotient law:

$$
2\ln 3 + \ln 5 - \ln 15 = \ln(3^2) + \ln 5 - \ln 15 = \ln(9 \times 5) - \ln 15 = \ln 45 - \ln 15 = \ln\!\left(\frac{45}{15}\right) = \ln 3.
$$

So the expression simplifies to $\ln 3$ (which is approximately $1.0986$).
:::

:::reveal{title="Worked example: evaluating a logarithm exactly"}
**Question.** Find $\log_2(32)$ without a calculator.

Write $32$ as a power of $2$: $32 = 2^5$. By the definition of a logarithm,

$$
\log_2(32) = \log_2(2^5) = 5.
$$
:::

## Change of base

Calculators typically only have $\log_{10}$ and $\ln$ buttons. To evaluate $\log_a(x)$ for another base $a$, use the **change of base formula**:

$$
\log_a(x) = \frac{\log_b(x)}{\log_b(a)}
$$

for any convenient base $b$ (usually $10$ or $e$). For example, $\log_5(20) = \dfrac{\ln 20}{\ln 5}$.

Use the code cell to check this numerically — it should print the same value twice:

::widget{type="code-runner" language="python" starter="import math\n\n# log base 5 of 20, computed two ways\ndirect = math.log(20, 5)\nchange_of_base = math.log(20) / math.log(5)\nprint('direct:', direct)\nprint('change of base:', change_of_base)" rows=8}

## Practice

Attempt the end-of-module assessment once you have completed all three lessons.
