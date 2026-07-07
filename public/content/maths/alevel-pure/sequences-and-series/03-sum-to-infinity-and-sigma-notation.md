# Sum to infinity and sigma notation

## When does a geometric series converge?

For an arithmetic series, adding more and more terms always makes the sum grow without bound (unless every term is zero). A geometric series can behave very differently: if the common ratio $r$ satisfies $|r| < 1$, each new term is smaller in size than the last, and the partial sums $S_n$ settle down towards a fixed value as $n \to \infty$. We say the series **converges**, and call that fixed value the **sum to infinity**, $S_\infty$.

Starting from $S_n = \dfrac{a(1-r^n)}{1-r}$: if $|r| < 1$ then $r^n \to 0$ as $n \to \infty$, so

$$
S_\infty = \frac{a}{1 - r} \qquad (|r| < 1).
$$

If $|r| \geq 1$ (and $r \neq 0$), the terms do not shrink to zero, the partial sums do not settle down, and the series **diverges** — it has no sum to infinity.

:::callout{kind="key"}
A geometric series converges iff $|r| < 1$. When it converges, $S_\infty = \dfrac{a}{1-r}$.
:::

The line chart below shows the partial sums $S_n$ for $a = 8$, $r = 0.5$ (so $|r| < 1$). Notice how $S_n$ gets closer and closer to $S_\infty = \dfrac{8}{1 - 0.5} = 16$ but never reaches it exactly.

::widget{type="data-plot" src="data/partial-sums-convergence.json"}

:::reveal{title="Worked example: sum to infinity"}
Find the sum to infinity of the geometric series with first term $a = 12$ and common ratio $r = \frac{1}{3}$.

Since $\left|\frac{1}{3}\right| < 1$, the series converges:

$$
S_\infty = \frac{12}{1 - \frac{1}{3}} = \frac{12}{\frac{2}{3}} = 12 \times \frac{3}{2} = 18.
$$
:::

:::callout{kind="tip"}
Always check $|r| < 1$ **before** using the sum-to-infinity formula. If $|r| \geq 1$, the correct answer is "the series does not converge" — applying the formula anyway gives a meaningless number.
:::

## Sigma notation

Sigma notation, $\sum$, is a compact way to write a sum. The expression

$$
\sum_{n=1}^{N} u_n
$$

means "add up $u_n$ for every integer $n$ from $1$ to $N$": $u_1 + u_2 + \cdots + u_N$. The letter under $\sum$ names the variable and its starting value; the number on top is the last value.

For example, for the arithmetic sequence $u_n = 4n + 3$:

$$
\sum_{n=1}^{5} (4n+3) = 7 + 11 + 15 + 19 + 23 = 75.
$$

For a geometric sequence $u_n = ar^{n-1}$, sigma notation and the series formulas connect directly:

$$
\sum_{n=1}^{N} ar^{n-1} = \frac{a(1-r^N)}{1-r}, \qquad \sum_{n=1}^{\infty} ar^{n-1} = \frac{a}{1-r} \ \ (|r|<1).
$$

:::reveal{title="Worked example: evaluating a sigma sum"}
Evaluate $\displaystyle\sum_{k=1}^{4} 3(2)^{k-1}$.

This is a geometric series with $a = 3$, $r = 2$, $N = 4$:

$$
\sum_{k=1}^{4} 3(2)^{k-1} = \frac{3(1-2^4)}{1-2} = \frac{3(1-16)}{-1} = \frac{3(-15)}{-1} = 45.
$$

Check by direct addition: $3 + 6 + 12 + 24 = 45$. ✓
:::

:::callout{kind="info"}
Sigma notation is just shorthand — to evaluate a sum written this way, first identify whether the underlying sequence is arithmetic or geometric, then apply the matching series formula.
:::

## Practice

Try the full end-of-module assessment below when you are ready — it covers arithmetic and geometric sequences and series, sum to infinity, and sigma notation.

::widget{type="quiz" src="assessment.json"}
