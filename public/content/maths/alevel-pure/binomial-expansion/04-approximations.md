# Approximations using the binomial expansion

## Why this works

When $x$ is small (say $|x| < 0.1$), higher powers of $x$ become tiny very quickly: if $x = 0.02$, then $x^2 = 0.0004$ and $x^3 = 0.000008$. In the expansion

$$
(1+x)^n = 1 + nx + \binom{n}{2}x^2 + \binom{n}{3}x^3 + \cdots + x^n,
$$

the terms from $x^2$ onward are small enough to ignore for a good approximation, leaving just the first two terms:

$$
(1+x)^n \approx 1 + nx \quad \text{for small } x.
$$

:::callout{kind="key"}
$(1+x)^n \approx 1 + nx$ when $x$ is small. The smaller $|x|$ is, the better the approximation — because the ignored terms involve higher powers of $x$, which shrink fastest.
:::

## Using the approximation

:::reveal{title="Worked example: approximate 1.02^10"}
Write $1.02 = 1 + 0.02$, so we want $(1+x)^n$ with $x = 0.02$ and $n = 10$.

$$
1.02^{10} = (1+0.02)^{10} \approx 1 + 10(0.02) = 1 + 0.2 = 1.2.
$$

The true value (to 5 d.p.) is $1.02^{10} = 1.21899\ldots$, so the approximation $1.2$ is correct to about 1 significant figure of error — good enough for a quick estimate, and the error shrinks further if $x$ is smaller.
:::

:::reveal{title="Worked example: approximate 0.98^5"}
Write $0.98 = 1 - 0.02$, so $x = -0.02$ and $n = 5$.

$$
0.98^{5} = (1 + (-0.02))^{5} \approx 1 + 5(-0.02) = 1 - 0.1 = 0.9.
$$

The true value is $0.98^5 = 0.90392\ldots$, close to the approximation $0.9$.
:::

## A more precise version: including the x² term

For a better approximation, keep the next term too:

$$
(1+x)^n \approx 1 + nx + \binom{n}{2}x^2 = 1 + nx + \frac{n(n-1)}{2}x^2.
$$

:::reveal{title="Worked example: approximate 1.01^8 to two terms and three terms"}
With $x = 0.01$, $n = 8$:

Two-term approximation: $1 + 8(0.01) = 1.08$.

Three-term approximation: $1 + 8(0.01) + \binom{8}{2}(0.01)^2 = 1 + 0.08 + 28 \times 0.0001 = 1 + 0.08 + 0.0028 = 1.0828$.

The true value is $1.01^8 = 1.082857\ldots$, so adding the $x^2$ term brings the estimate much closer to the true value than the two-term version alone.
:::

## Checking approximations with code

Compare the two-term approximation against the true value for different choices of $n$ and $x$ — notice how the error grows as $|x|$ increases.

::widget{type="code-runner" language="python" starter="def approx_two_term(n, x):\n    return 1 + n * x\n\ndef true_value(n, x):\n    return (1 + x) ** n\n\nfor x in [0.001, 0.01, 0.05, 0.1, 0.2]:\n    n = 10\n    a = approx_two_term(n, x)\n    t = true_value(n, x)\n    print(f'x={x:<6} approx={a:.6f}  true={t:.6f}  error={abs(t-a):.6f}')\n" rows=12}

You have now met the four core ideas of this module: Pascal's triangle and $\binom{n}{r}$, the full binomial theorem, finding specific terms, and approximation. Test your understanding with the end-of-module assessment.
