# Factorising expressions

Factorising is the reverse of expanding: instead of multiplying brackets out, we write an expression **as** a product of brackets (or a factor and a bracket). It is one of the most useful algebra skills, because factorised expressions reveal where an expression equals zero.

## Factorising by taking out a common factor

If every term in an expression shares a common factor, take the largest one out the front and put what's left in a bracket:

$$
6x + 9 = 3(2x + 3),
$$

since $3$ divides both $6$ and $9$. With variables too:

$$
4x^2 + 8x = 4x(x + 2),
$$

because $4x$ divides both $4x^2$ (leaving $x$) and $8x$ (leaving $2$).

:::callout{kind="tip"}
Always check by expanding your answer back out — it should return exactly the expression you started with. $3(2x+3) = 6x + 9$. ✓
:::

## Factorising simple quadratics by inspection

A quadratic like $x^2 + 5x + 6$ can often be factorised into two brackets $(x + p)(x + q)$. Expanding $(x+p)(x+q)$ gives $x^2 + (p+q)x + pq$, so we need two numbers $p$ and $q$ that:

- **multiply** to give the constant term ($6$), and
- **add** to give the coefficient of $x$ ($5$).

For $x^2 + 5x + 6$: the pairs that multiply to $6$ are $(1,6)$ and $(2,3)$. Of these, $2 + 3 = 5$, so $p = 2$, $q = 3$:

$$
x^2 + 5x + 6 = (x+2)(x+3).
$$

Negative numbers work the same way. For $x^2 - 2x - 15$, we need two numbers multiplying to $-15$ and adding to $-2$: that's $-5$ and $3$, since $-5 \times 3 = -15$ and $-5 + 3 = -2$:

$$
x^2 - 2x - 15 = (x-5)(x+3).
$$

:::reveal{title="Worked example: factorise x^2 + 7x + 12"}
Factorise $x^2 + 7x + 12$.

**Find two numbers that multiply to $12$ and add to $7$.** Try the factor pairs of $12$: $(1,12)$, $(2,6)$, $(3,4)$. Check the sums: $1+12=13$, $2+6=8$, $3+4=7$ — that's the one.

So $p = 3$, $q = 4$, giving

$$
x^2 + 7x + 12 = (x+3)(x+4).
$$

**Check by expanding:** $(x+3)(x+4) = x^2 + 4x + 3x + 12 = x^2 + 7x + 12$. ✓
:::

## Why factorising matters: linking to graphs

When a quadratic is written in factorised form, its roots (where the graph crosses the $x$-axis) are easy to read off. $x^2 + 5x + 6 = (x+2)(x+3)$ equals zero exactly when $x = -2$ or $x = -3$ — the values that make one of the brackets zero. The graph below confirms this: the curve crosses the $x$-axis at $x=-2$ and $x=-3$.

::widget{type="function-grapher" expr="x^2+5*x+6" xmin=-6 xmax=2 ymin=-3 ymax=8}

:::callout{kind="key"}
To factorise a common-factor expression, take out the largest shared factor. To factorise $x^2 + bx + c$ by inspection, find two numbers that multiply to $c$ and add to $b$ — these become the constants in $(x+p)(x+q)$. Always check by expanding back out.
:::
