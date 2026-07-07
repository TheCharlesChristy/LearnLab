# Pascal's triangle and binomial coefficients

Expanding brackets like $(a+b)^2$ or $(a+b)^3$ is familiar. This module builds a systematic way to expand $(a+b)^n$ for **any** positive integer $n$, without laboriously multiplying brackets together term by term.

## Pascal's triangle

Each row of Pascal's triangle gives the coefficients that appear when you expand $(a+b)^n$. Row $n$ starts and ends with $1$, and every other entry is the sum of the two entries diagonally above it.

$$
\begin{array}{ccccccccccccc}
n=0: & & & & & & 1 \\
n=1: & & & & & 1 & & 1 \\
n=2: & & & & 1 & & 2 & & 1 \\
n=3: & & & 1 & & 3 & & 3 & & 1 \\
n=4: & & 1 & & 4 & & 6 & & 4 & & 1 \\
n=5: & 1 & & 5 & & 10 & & 10 & & 5 & & 1
\end{array}
$$

Compare row $n=2$ with $(a+b)^2 = 1a^2 + 2ab + 1b^2$, and row $n=3$ with $(a+b)^3 = 1a^3 + 3a^2b + 3ab^2 + 1b^3$: the row entries are exactly the coefficients.

:::callout{kind="tip"}
To build the next row, write $1$ at each end, and fill each interior entry as the sum of the two numbers above it. Row $n=4$ comes from row $n=3$: $1,\ (1+3)=4,\ (3+3)=6,\ (3+1)=4,\ 1$.
:::

## Binomial coefficients: $\binom{n}{r}$ or $^n C_r$

Row $n$, entry $r$ (counting from $r=0$) is the **binomial coefficient**, written $\binom{n}{r}$ or $^nC_r$, and computed by

$$
\binom{n}{r} = {}^nC_r = \frac{n!}{r!\,(n-r)!},
$$

where $n! = n \times (n-1) \times \cdots \times 2 \times 1$ and $0! = 1$. This counts the number of ways to choose $r$ objects from $n$ distinct objects, which is exactly why it turns up as the multiplying factor when brackets are expanded: $\binom{n}{r}$ counts the number of ways to pick $b$ from $r$ of the $n$ brackets (and $a$ from the rest).

:::reveal{title="Worked example: computing a binomial coefficient"}
Find $\binom{6}{2}$.

$$
\binom{6}{2} = \frac{6!}{2!\,4!} = \frac{6 \times 5 \times 4!}{2! \times 4!} = \frac{6 \times 5}{2 \times 1} = \frac{30}{2} = 15.
$$

Check against Pascal's triangle: row $n=6$ is $1, 6, 15, 20, 15, 6, 1$ — entry $r=2$ (third number) is indeed $15$.
:::

## Key properties

- $\binom{n}{0} = \binom{n}{n} = 1$ for every $n$ (there is exactly one way to choose nothing, or everything).
- $\binom{n}{r} = \binom{n}{n-r}$ — Pascal's triangle is symmetric.
- The factorials grow fast, so for larger $n$ it is often quicker to cancel common factors rather than compute full factorials, as in the worked example above.

Use the calculator below to check binomial coefficients as you practise — enter values of $n$ and $r$ and compare with your own hand calculation.

::widget{type="code-runner" language="python" starter="from math import comb\n\nn = 8\nr = 3\nprint(f'C({n},{r}) =', comb(n, r))\n\n# Try changing n and r above, or print a whole row:\nn = 6\nprint(f'Row {n} of Pascal\\'s triangle:', [comb(n, k) for k in range(n + 1)])" rows=10}

:::callout{kind="info"}
`math.comb(n, r)` in Python computes $\binom{n}{r}$ directly — a handy way to check hand calculations while you practise.
:::

Next, we turn Pascal's triangle into a formula for expanding any $(a+b)^n$: the binomial theorem.
