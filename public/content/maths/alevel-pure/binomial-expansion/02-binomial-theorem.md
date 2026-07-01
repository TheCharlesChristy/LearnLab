# The binomial theorem and full expansions

## Statement of the theorem

For a positive integer $n$, the **binomial theorem** says

$$
(a+b)^n = \sum_{r=0}^{n} \binom{n}{r} a^{n-r} b^r
= \binom{n}{0}a^n + \binom{n}{1}a^{n-1}b + \binom{n}{2}a^{n-2}b^2 + \cdots + \binom{n}{n}b^n.
$$

Each term has total power $n$ (the powers of $a$ and $b$ always add to $n$), the power of $a$ falls from $n$ to $0$, the power of $b$ rises from $0$ to $n$, and the coefficients are read straight from row $n$ of Pascal's triangle — or computed with $\binom{n}{r} = \dfrac{n!}{r!(n-r)!}$.

:::callout{kind="key"}
There are $n+1$ terms in the expansion of $(a+b)^n$, indexed by $r = 0, 1, \dots, n$. The term for a given $r$ is $\binom{n}{r}a^{n-r}b^r$.
:::

## Working through an expansion step by step

Follow the expansion of $(a+b)^5$ one stage at a time:

::widget{type="step-reveal" src="steps/expand-a-plus-b-5.json"}

## Expanding when $a$ or $b$ has a coefficient or is negative

When $a$ or $b$ is itself an expression like $2x$ or $-3y$, substitute the whole expression in place of $a$ or $b$ and simplify each term carefully, taking care with signs and powers.

:::reveal{title="Worked example: expand (2x + 3)^4"}
Here $a = 2x$, $b = 3$, $n = 4$. Row $n=4$ of Pascal's triangle is $1, 4, 6, 4, 1$, so

$$
(2x+3)^4 = \binom{4}{0}(2x)^4 + \binom{4}{1}(2x)^3(3) + \binom{4}{2}(2x)^2(3)^2 + \binom{4}{3}(2x)(3)^3 + \binom{4}{4}(3)^4.
$$

Evaluate each term:

- $r=0$: $1 \times 16x^4 \times 1 = 16x^4$
- $r=1$: $4 \times 8x^3 \times 3 = 96x^3$
- $r=2$: $6 \times 4x^2 \times 9 = 216x^2$
- $r=3$: $4 \times 2x \times 27 = 216x$
- $r=4$: $1 \times 1 \times 81 = 81$

So $(2x+3)^4 = 16x^4 + 96x^3 + 216x^2 + 216x + 81$.

**Check:** substituting $x=1$ gives $16+96+216+216+81 = 625 = 5^4 = (2(1)+3)^4$. ✓
:::

:::reveal{title="Worked example: expand (1 - 2x)^6"}
Here $a = 1$, $b = -2x$, $n = 6$. Row $n=6$ is $1, 6, 15, 20, 15, 6, 1$. Because $b$ is negative, alternate terms will be negative — track the sign of $(-2)^r$ carefully:

| $r$ | $\binom{6}{r}$ | $(-2)^r$ | coefficient of $x^r$ |
| --- | --- | --- | --- |
| 0 | 1 | 1 | $1$ |
| 1 | 6 | $-2$ | $-12$ |
| 2 | 15 | 4 | $60$ |
| 3 | 20 | $-8$ | $-160$ |
| 4 | 15 | 16 | $240$ |
| 5 | 6 | $-32$ | $-192$ |
| 6 | 1 | 64 | $64$ |

So $(1-2x)^6 = 1 - 12x + 60x^2 - 160x^3 + 240x^4 - 192x^5 + 64x^6$.
:::

## Checking an expansion with code

Use the widget below to verify a full expansion numerically: pick values of $a$, $b$, $n$, expand symbolically by hand, then confirm both sides agree when you substitute numbers in.

::widget{type="code-runner" language="python" starter="from math import comb\n\ndef expand_terms(a_coef, b_coef, n):\n    # returns list of (power_of_x, coefficient) for (a_coef*x + b_coef)^n\n    terms = []\n    for r in range(n + 1):\n        power = n - r\n        coeff = comb(n, r) * (a_coef ** (n - r)) * (b_coef ** r)\n        terms.append((power, coeff))\n    return terms\n\n# Example: (2x + 3)^4\nfor power, coeff in expand_terms(2, 3, 4):\n    print(f'{coeff} x^{power}')\n" rows=12}

Next, we look at how to find one specific term of an expansion — the coefficient of a particular power — without writing out every term.
