# Factorising and solving simple quadratics

In the last lesson we saw that expanding $(x+p)(x+q)$ gives

$$
(x+p)(x+q) = x^2 + (p+q)x + pq.
$$

**Factorising** a quadratic $x^2 + bx + c$ means running this process backwards: finding the pair of numbers $p$ and $q$ that multiply to give $c$ and add to give $b$, then writing the quadratic as $(x+p)(x+q)$. This lesson only deals with the case $a = 1$ (no number in front of the $x^2$) — factorising when $a \neq 1$ is a more advanced skill for later study.

## Finding the factor pair

**Example.** Factorise $x^2 + 8x + 15$.

We need two numbers that:

- **multiply** to give $c = 15$, and
- **add** to give $b = 8$.

Listing factor pairs of $15$: $1 \times 15$, $3 \times 5$. Checking sums: $1 + 15 = 16$ (no), $3 + 5 = 8$ (yes!). So $p = 3$, $q = 5$, and

$$
x^2 + 8x + 15 = (x+3)(x+5).
$$

This is exactly the reverse of the first worked example in the previous lesson — a useful sign that the method is consistent.

:::reveal{title="Worked example: a quadratic with negative numbers"}
Factorise $x^2 - 2x - 15$.

We need two numbers multiplying to $c = -15$ and adding to $b = -2$. Since the product is negative, one number must be positive and one negative. Trying factor pairs of $15$ with opposite signs: $3$ and $-5$ give a product of $-15$ and a sum of $3 + (-5) = -2$ — exactly what we need.

$$
x^2 - 2x - 15 = (x+3)(x-5).
$$

*Check by expanding back:* $(x+3)(x-5) = x^2 - 5x + 3x - 15 = x^2 - 2x - 15$. ✓
:::

## Solving by setting each factor to zero

Once a quadratic is factorised, solving the equation $x^2+bx+c=0$ is straightforward using a key fact about numbers: **if two numbers multiply to give zero, at least one of them must itself be zero.** (There is no other way to multiply two non-zero numbers and get $0$.)

So if $(x+p)(x+q) = 0$, then either $x + p = 0$ or $x + q = 0$, giving $x = -p$ or $x = -q$.

**Example.** Solve $x^2 + 8x + 15 = 0$.

We already factorised this as $(x+3)(x+5) = 0$. So either

$$
x + 3 = 0 \implies x = -3, \qquad \text{or} \qquad x + 5 = 0 \implies x = -5.
$$

The solutions are $x = -3$ and $x = -5$. Always check: $(-3)^2+8(-3)+15 = 9-24+15=0$ ✓, and $(-5)^2+8(-5)+15=25-40+15=0$ ✓.

:::callout{kind="key"}
A quadratic equation typically has **two** solutions (sometimes called **roots**), one from each bracket. Occasionally the two brackets are identical (e.g. $(x-4)(x-4)=0$), giving a single **repeated** root.
:::

## A worked solve from scratch

**Example.** Solve $x^2 + 2x - 8 = 0$.

*Factorise:* we need two numbers multiplying to $-8$ and adding to $2$. Trying $4$ and $-2$: product $= 4 \times (-2) = -8$ ✓, sum $= 4 + (-2) = 2$ ✓.

$$
x^2 + 2x - 8 = (x+4)(x-2) = 0.
$$

*Solve:* $x + 4 = 0 \implies x = -4$, or $x - 2 = 0 \implies x = 2$.

*Check:* $(-4)^2+2(-4)-8 = 16-8-8=0$ ✓; $(2)^2+2(2)-8=4+4-8=0$ ✓.

:::reveal{title="Worked example: solving x² - 5x + 6 = 0"}
*Factorise:* need two numbers multiplying to $6$, adding to $-5$. Both must be negative (product positive, sum negative): $-2$ and $-3$ work, since $(-2)(-3)=6$ and $(-2)+(-3)=-5$.

$$
x^2 - 5x + 6 = (x-2)(x-3) = 0.
$$

*Solve:* $x = 2$ or $x = 3$.

*Check:* $2^2-5(2)+6=4-10+6=0$ ✓; $3^2-5(3)+6=9-15+6=0$ ✓.
:::

:::callout{kind="warning"}
A very common mistake is factorising correctly but then forgetting to flip the sign when solving — from $(x+4)=0$ the solution is $x=-4$, **not** $x=4$. Always double-check by substituting your solutions back into the original equation.
:::

In the next lesson we look at what the graph of a quadratic actually looks like, and how the factorised form tells you exactly where that graph crosses the x-axis.
