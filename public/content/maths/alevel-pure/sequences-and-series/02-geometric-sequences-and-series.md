# Geometric sequences and series

In a **geometric sequence**, you get from one term to the next by multiplying by a fixed number each time, called the **common ratio**, $r$.

For example, $2, 6, 18, 54, 162, \ldots$ is geometric with common ratio $r = 3$: each term is $3$ times the one before.

## The nth term

If the first term is $a$ and the common ratio is $r$, the $n$th term is

$$
u_n = ar^{n-1}.
$$

This works because to reach the $n$th term from the first term you multiply by $r$ exactly $n-1$ times.

:::callout{kind="key"}
Geometric sequence, $n$th term: $u_n = ar^{n-1}$, where $a$ is the first term and $r$ is the common ratio.
:::

The scatter plot below shows $u_n = 2(3)^{n-1}$ for $n = 1$ to $5$ — notice the rapid (exponential) growth compared with an arithmetic sequence's straight-line growth.

::widget{type="data-plot" src="data/geometric-terms.json"}

:::reveal{title="Worked example: finding the common ratio and a term"}
A geometric sequence has first term $a = 5$ and third term $u_3 = 45$.

Since $u_3 = ar^2$:

$$
45 = 5r^2 \implies r^2 = 9 \implies r = \pm 3.
$$

Both values are valid unless the question restricts to positive terms. Taking $r = 3$: $u_n = 5(3)^{n-1}$, so the 5th term is

$$
u_5 = 5(3)^4 = 5 \times 81 = 405.
$$
:::

## Geometric series

A **geometric series** is the sum of the terms of a geometric sequence. For $r \neq 1$, multiplying $S_n = a + ar + ar^2 + \cdots + ar^{n-1}$ by $r$ and subtracting gives:

$$
S_n = \frac{a(1 - r^n)}{1 - r} \qquad (r \neq 1).
$$

(Equivalently $S_n = \dfrac{a(r^n - 1)}{r - 1}$ — the same value, just avoiding a negative divided by a negative when $r > 1$.)

:::callout{kind="key"}
Geometric series sum: $S_n = \dfrac{a(1 - r^n)}{1 - r}$ for $r \neq 1$.
:::

:::reveal{title="Worked example: sum of a geometric series"}
Find the sum of the first $6$ terms of the geometric sequence with $a = 4$ and $r = 2$.

$$
S_6 = \frac{4(1 - 2^6)}{1 - 2} = \frac{4(1 - 64)}{-1} = \frac{4(-63)}{-1} = 252.
$$

Check by direct addition: $4 + 8 + 16 + 32 + 64 + 128 = 252$. ✓
:::

You can also compute terms and partial sums programmatically. Edit the code below (it prints the first 6 terms and the running sum for $a=4$, $r=2$) and press Run to check the worked example above.

::widget{type="code-runner" language="python" starter="a = 4\nr = 2\nn_terms = 6\n\nterms = [a * r**(n - 1) for n in range(1, n_terms + 1)]\nprint('terms:', terms)\nprint('sum:', sum(terms))" rows=10}

:::callout{kind="warning"}
Watch the sign of $1 - r$: when $r > 1$ this denominator is negative, and the numerator $1 - r^n$ is also negative for growing sequences, so the two negatives cancel to give a positive sum. A common error is dropping a sign in this step.
:::

## Practice

Try the questions below, then move on to sum to infinity and sigma notation.

::widget{type="quiz" src="assessment.json" pick=4}
