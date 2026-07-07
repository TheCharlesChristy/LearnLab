# Expanding and simplifying expressions

Algebra lets us write general rules using letters (**variables**) instead of specific numbers. Before we can solve equations or factorise, we need two basic skills: **collecting like terms** and **expanding brackets**. This lesson builds both from scratch.

## Collecting like terms

A **term** is a single number, a single variable, or a product of numbers and variables, such as $4x$, $3y^2$, or $7$. **Like terms** have exactly the same variable(s) raised to exactly the same power — $3x$ and $5x$ are like terms, but $3x$ and $3x^2$ are not, and $3x$ and $3y$ are not.

To simplify an expression, add or subtract the coefficients of like terms and leave unlike terms alone:

$$
5x + 3 - 2x + 7 = (5x - 2x) + (3 + 7) = 3x + 10.
$$

Another example, with two variables:

$$
4x + 3y - 2x + y = (4x - 2x) + (3y + y) = 2x + 4y.
$$

:::callout{kind="info"}
Only combine terms that match exactly in their variable and power. $x$ and $x^2$ can never be collected together, no matter how tempting it looks.
:::

## Expanding a single bracket

"Expanding" (or "multiplying out") a bracket means multiplying everything inside it by whatever sits outside:

$$
a(b + c) = ab + ac.
$$

For example, $3(x + 4) = 3x + 12$. Watch the sign carefully when the multiplier is negative:

$$
-2(x - 5) = -2x + 10.
$$

Every term inside the bracket is multiplied by $-2$, including the sign of $-5$, so $-2 \times (-5) = +10$.

:::reveal{title="Worked example: expand and simplify"}
Expand and simplify $3(x + 4) - 2(x - 1)$.

**Expand each bracket separately:**
$3(x+4) = 3x + 12$
$-2(x-1) = -2x + 2$

**Add the results together:**
$3x + 12 - 2x + 2 = (3x - 2x) + (12 + 2) = x + 14$.

So $3(x+4) - 2(x-1) = x + 14$.
:::

## Expanding two brackets

To expand a product of two brackets like $(x+2)(x+3)$, multiply **every** term in the first bracket by **every** term in the second, then collect like terms. A common way to remember the four products is **FOIL**: First, Outer, Inner, Last.

$$
(x+2)(x+3) = \underbrace{x \times x}_{\text{First}} + \underbrace{x \times 3}_{\text{Outer}} + \underbrace{2 \times x}_{\text{Inner}} + \underbrace{2 \times 3}_{\text{Last}} = x^2 + 3x + 2x + 6 = x^2 + 5x + 6.
$$

The two middle terms ($3x$ and $2x$) are like terms, so they collect into $5x$.

:::reveal{title="Worked example: expand and simplify (x+4)(x-2)"}
Expand $(x+4)(x-2)$.

**First:** $x \times x = x^2$
**Outer:** $x \times (-2) = -2x$
**Inner:** $4 \times x = 4x$
**Last:** $4 \times (-2) = -8$

Adding these: $x^2 - 2x + 4x - 8 = x^2 + 2x - 8$.

So $(x+4)(x-2) = x^2 + 2x - 8$.
:::

## Check it numerically

An expanded expression must give the **same value** as the original bracketed form for any $x$, because expanding is just rewriting, not changing the expression. Use the code runner to verify this: it substitutes a chosen value of $x$ into both the bracketed form and the expanded form and checks they match.

::widget{type="code-runner" language="python" starter="# Check that (x+2)(x+3) expands correctly to x^2 + 5x + 6\nx = 7\n\nbracketed = (x + 2) * (x + 3)\nexpanded = x**2 + 5*x + 6\n\nprint('(x+2)(x+3) =', bracketed)\nprint('x^2 + 5x + 6 =', expanded)\nprint('Equal?', bracketed == expanded)" rows=10}

Try changing `x` to a few different numbers (including negative ones) and re-running — the two sides should always agree, because they are algebraically identical.

:::callout{kind="key"}
Collecting like terms combines matching variable-power terms; expanding a bracket multiplies every inside term by the outside factor(s). Expanding two brackets means every term in the first multiplies every term in the second (FOIL), then like terms collect as usual.
:::
