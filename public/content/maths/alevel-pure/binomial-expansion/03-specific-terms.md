# Finding specific terms and coefficients

Writing out an entire expansion just to find one coefficient is wasteful. The general term of the binomial theorem lets you jump straight to the term you need.

## The general term

The term containing $b^r$ (equivalently, the $(r+1)$-th term, since we start counting from $r=0$) in the expansion of $(a+b)^n$ is

$$
T_{r+1} = \binom{n}{r}a^{n-r}b^r.
$$

To find "the coefficient of $x^k$" in an expansion, identify which value of $r$ makes the power of $x$ equal to $k$, then substitute that $r$ into the general term.

:::callout{kind="tip"}
Set up the general term first, simplify the power of $x$ in terms of $r$, then solve for the $r$ that gives the power you want. Only then evaluate the coefficient — this avoids expanding unnecessary terms.
:::

:::reveal{title="Worked example: coefficient of x^3 in (2 + x)^7"}
Here $a = 2$, $b = x$, $n = 7$. The general term is

$$
T_{r+1} = \binom{7}{r}(2)^{7-r}(x)^r.
$$

We want the power of $x$ to be $3$, so $r = 3$. Then

$$
T_4 = \binom{7}{3}(2)^{4}(x)^3 = 35 \times 16 \times x^3 = 560x^3.
$$

So the coefficient of $x^3$ is $\mathbf{560}$.
:::

:::reveal{title="Worked example: term in x^5 of (3 - x)^8"}
Here $a = 3$, $b = -x$, $n = 8$. We want the power of $x$ (i.e. of $b$) to be $5$, so $r = 5$:

$$
T_6 = \binom{8}{5}(3)^{3}(-x)^5 = 56 \times 27 \times (-1)x^5 = -1512x^5.
$$

So the term in $x^5$ is $-1512x^5$, i.e. the coefficient is $\mathbf{-1512}$.
:::

## Finding a coefficient given as an unknown

Sometimes a question gives you the value of a coefficient and asks you to find an unknown that appears inside the bracket, such as $a$ or $b$ itself.

:::reveal{title="Worked example: find k given a coefficient"}
In the expansion of $(1+kx)^5$, the coefficient of $x^2$ is $90$. Find the possible value(s) of $k$.

The general term with $a=1$, $b=kx$, $n=5$ is $T_{r+1} = \binom{5}{r}(1)^{5-r}(kx)^r = \binom{5}{r}k^r x^r$.

For the $x^2$ term, $r=2$:

$$
\binom{5}{2}k^2 = 90 \implies 10k^2 = 90 \implies k^2 = 9 \implies k = \pm 3.
$$

So $k = 3$ or $k = -3$.
:::

## Practising with code

The calculator below finds the coefficient of a chosen power of $x$ in $(a + bx)^n$ directly, by looping over $r$ until the power matches — a useful way to check your hand-worked answers.

::widget{type="code-runner" language="python" starter="from math import comb\n\ndef coefficient_of_x_power(a, b, n, target_power):\n    for r in range(n + 1):\n        power = n - r\n        if power == target_power:\n            return comb(n, r) * (a ** (n - r)) * (b ** r)\n    return None  # power not present in this expansion\n\n# Example: coefficient of x^3 in (2 + x)^7  (here bracket is a + b*x with a=2, b=1)\nprint(coefficient_of_x_power(2, 1, 7, 3))\n\n# Example: term in x^5 of (3 - x)^8  (a=3, b=-1)\nprint(coefficient_of_x_power(3, -1, 8, 5))\n" rows=12}

Finally, we look at a powerful application of the expansion: using it to approximate numbers close to $1$.
