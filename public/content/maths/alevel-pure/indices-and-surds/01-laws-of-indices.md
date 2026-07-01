# The laws of indices

An **index** (or **exponent** or **power**) tells you how many times a base is multiplied by itself. In $a^n$, $a$ is the base and $n$ is the index. This lesson collects the rules for combining and manipulating indices — the algebra that makes working with powers fast and reliable.

## Multiplying and dividing powers of the same base

When the bases match, multiplying adds the indices and dividing subtracts them:

$$
a^m \times a^n = a^{m+n}, \qquad \frac{a^m}{a^n} = a^{m-n}.
$$

For example, $2^3 \times 2^4 = 2^7 = 128$, and $\dfrac{5^6}{5^2} = 5^4 = 625$.

:::callout{kind="info"}
These rules only apply directly when the **bases are the same**. You cannot simplify $2^3 \times 3^4$ this way — the bases must match first.
:::

## Raising a power to a power

To raise a power to a further power, multiply the indices:

$$
(a^m)^n = a^{mn}.
$$

For example, $(2^3)^2 = 2^6 = 64$, which checks out since $(2^3)^2 = 8^2 = 64$.

## The zero index

Any non-zero number raised to the power $0$ equals $1$:

$$
a^0 = 1 \quad (a \neq 0).
$$

:::reveal{title="Why does a^0 = 1?"}
Using the division law with $m = n$: $\dfrac{a^n}{a^n} = a^{n-n} = a^0$. But any (non-zero) number divided by itself is $1$, so $a^0$ must equal $1$. This is consistent, not a separate rule — it falls straight out of $a^m / a^n = a^{m-n}$.
:::

## Putting the rules together

Explore how the value of $a^x$ changes with $x$ for different bases $a$. Notice that every curve passes through $(0, 1)$ — confirming $a^0 = 1$ — and that for $a > 1$ the curve grows rapidly for positive $x$.

::widget{type="function-grapher" expr="2^x" xmin=-4 xmax=4 ymin=0 ymax=16}

:::reveal{title="Worked example: simplify using the laws of indices"}
Simplify $\dfrac{a^5 \times a^2}{a^4}$.

**Numerator first:** $a^5 \times a^2 = a^{5+2} = a^7$.

**Then divide:** $\dfrac{a^7}{a^4} = a^{7-4} = a^3$.

So $\dfrac{a^5 \times a^2}{a^4} = a^3$.
:::

## Try it yourself

Use the code runner below to check numeric examples of the laws of indices — edit the values and re-run to build confidence that the rules always agree with direct computation.

::widget{type="code-runner" language="python" starter="# Check a law of indices numerically\na = 3\nm, n = 4, 2\n\nlhs = (a ** m) * (a ** n)\nrhs = a ** (m + n)\nprint('a^m * a^n =', lhs)\nprint('a^(m+n) =', rhs)\nprint('Equal?', lhs == rhs)" rows=10}

:::callout{kind="key"}
The three core laws — $a^m \times a^n = a^{m+n}$, $\dfrac{a^m}{a^n} = a^{m-n}$, $(a^m)^n = a^{mn}$ — plus $a^0 = 1$ are the foundation for everything else in this module, including negative and fractional indices.
:::
