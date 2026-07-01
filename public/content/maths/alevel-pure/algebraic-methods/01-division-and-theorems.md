# Algebraic division and the factor and remainder theorems

You already know how to multiply out brackets like $(x-2)(x^2+4x+3)$ to get a cubic. This lesson works in reverse: given a cubic (or higher-degree) polynomial, how do we divide it by a linear factor, and how do we tell in advance which linear factors it has?

## Dividing a polynomial by a linear factor

Polynomial division works like long division of numbers. To divide $f(x) = x^3 - 4x^2 + x + 6$ by $(x - 2)$, we find a quotient $q(x)$ and remainder $r$ such that

$$
f(x) = (x-2)\,q(x) + r.
$$

Working through the long division:

$$
\begin{aligned}
x^3 - 4x^2 + x + 6 &= (x-2)(x^2 + ax + b) + r \\
\end{aligned}
$$

Matching coefficients (or dividing step by step, bringing down each term): $x^3 \div x = x^2$; multiply back $x^2(x-2) = x^3 - 2x^2$; subtract to get $-2x^2 + x + 6$; then $-2x^2 \div x = -2x$; multiply back $-2x(x-2) = -2x^2+4x$; subtract to get $-3x + 6$; then $-3x \div x = -3$; multiply back $-3(x-2) = -3x+6$; subtract to get remainder $0$. So

$$
x^3 - 4x^2 + x + 6 = (x-2)(x^2 - 2x - 3).
$$

Step through the full working below.

::widget{type="step-reveal" src="steps/dividing-cubic.json"}

:::callout{kind="tip"}
Always check a division by multiplying the quotient by the divisor and adding the remainder — you should get back the original polynomial exactly.
:::

## The factor theorem

Notice that dividing by $(x-2)$ left remainder $0$. This is not a coincidence: substituting $x=2$ into $f(x) = x^3-4x^2+x+6$ gives $f(2) = 8 - 16 + 2 + 6 = 0$.

:::callout{kind="key"}
**Factor theorem.** For a polynomial $f(x)$, if $f(a) = 0$ then $(x-a)$ is a factor of $f(x)$. Conversely, if $(x-a)$ is a factor of $f(x)$ then $f(a) = 0$.
:::

This gives a fast way to *test* candidate factors before doing any division at all: just substitute and see if you get zero. For integer-coefficient polynomials, the candidates worth testing are the factors of the constant term (divided by factors of the leading coefficient).

:::reveal{title="Worked example: using the factor theorem to find a factor"}
Show that $(x+1)$ is a factor of $f(x) = x^3 - 4x^2 + x + 6$.

Substitute $x = -1$:

$$
f(-1) = (-1)^3 - 4(-1)^2 + (-1) + 6 = -1 - 4 - 1 + 6 = 0.
$$

Since $f(-1) = 0$, the factor theorem tells us $(x-(-1)) = (x+1)$ is a factor of $f(x)$, without doing any division.
:::

## The remainder theorem

What if substituting doesn't give zero? The **remainder theorem** generalises the idea: it tells you the remainder of a division without carrying out the division.

:::callout{kind="key"}
**Remainder theorem.** When a polynomial $f(x)$ is divided by $(x-a)$, the remainder is $f(a)$.
:::

The factor theorem is just the special case $f(a) = 0$ (remainder zero means exact division, i.e. a factor).

:::reveal{title="Worked example: applying the remainder theorem"}
Find the remainder when $f(x) = 2x^3 - 3x^2 - 4x + 1$ is divided by $(x-2)$.

By the remainder theorem, the remainder equals $f(2)$:

$$
f(2) = 2(8) - 3(4) - 4(2) + 1 = 16 - 12 - 8 + 1 = -3.
$$

So the remainder is $-3$. (Check by division: $2x^3-3x^2-4x+1 = (x-2)(2x^2+x-2) - 3$ — multiplying out confirms this.)
:::

Here is a plot of that cubic, showing where it crosses the $x$-axis (its real roots) and its value at $x=2$, which is not a root:

::widget{type="function-grapher" expr="2*x^3 - 3*x^2 - 4*x + 1" xmin=-3 xmax=3}

In the next lesson we use the factor theorem to hunt for all the factors of a cubic (or quartic) and solve the corresponding equation.
