# The binomial probability formula

If $X \sim B(n, p)$, we can write down an exact formula for the probability
of getting *exactly* $r$ successes out of $n$ trials.

## Building the formula

Think about one particular way of getting $r$ successes and $n - r$
failures, in a specific order — say, all $r$ successes first, then all the
failures. Because the trials are independent, the probability of that exact
sequence is

$$
\underbrace{p \times p \times \cdots \times p}_{r \text{ times}} \times
\underbrace{(1-p) \times (1-p) \times \cdots \times (1-p)}_{n-r \text{ times}}
= p^r (1-p)^{n-r}.
$$

Every other *order* of the same $r$ successes and $n-r$ failures has exactly
the same probability, $p^r(1-p)^{n-r}$, because multiplication doesn't care
about order. So we just need to count **how many orders** (arrangements)
there are — and that count is the binomial coefficient $\binom{n}{r}$,
read "$n$ choose $r$":

$$
\binom{n}{r} = {}^nC_r = \frac{n!}{r!(n-r)!}.
$$

Putting the count of arrangements together with the probability of each
arrangement gives the **binomial probability formula**:

:::callout{kind="key"}
If $X \sim B(n,p)$, then for $r = 0, 1, 2, \ldots, n$:
$$
P(X = r) = \binom{n}{r} p^r (1-p)^{n-r}
$$
:::

## A worked example

:::reveal{title="Worked example — a single probability"}
**A biased coin has $P(\text{heads}) = 0.3$. It is tossed 6 times. Let $X$ be
the number of heads. Find $P(X = 2)$.**

Here $X \sim B(6, 0.3)$, so $n = 6$, $p = 0.3$, $r = 2$.

$$
\binom{6}{2} = \frac{6!}{2!\,4!} = \frac{6 \times 5}{2 \times 1} = 15
$$

$$
P(X = 2) = \binom{6}{2}(0.3)^2(0.7)^4 = 15 \times 0.09 \times 0.2401
$$

$$
= 15 \times 0.021609 = 0.324135 \approx 0.3241 \text{ (4 d.p.)}
$$
:::

The chart below shows every value of $P(X = r)$ for this same distribution,
$X \sim B(6, 0.3)$, computed the same way for each $r$ from 0 to 6 (the bars
sum to 1, as they must for a complete probability distribution).

::widget{type="data-plot" src="data/b6-03.json"}

## Cumulative probabilities

Exam questions very often ask for $P(X \le r)$ ("at most $r$ successes") or
$P(X \ge r)$ ("at least $r$ successes") rather than a single value of $X$.
For small $n$ you can compute these directly by **adding up** the
individual probabilities you need.

$$
P(X \le r) = P(X=0) + P(X=1) + \cdots + P(X=r)
$$

For "at least" probabilities, it is almost always faster to use the
**complement rule**, since $P(X \ge r) = 1 - P(X \le r - 1)$:

$$
P(X \ge r) = 1 - P(X \le r-1)
$$

:::reveal{title="Worked example — cumulative probabilities"}
**Using $X \sim B(6, 0.3)$ from above, find (a) $P(X \le 2)$ and (b)
$P(X \ge 4)$.**

From the chart: $P(X=0) = 0.11765$, $P(X=1) = 0.30253$, $P(X=2) = 0.32413$
(each rounded to 5 d.p.; you can check $P(X=1)$ yourself: $\binom{6}{1} = 6$,
so $P(X=1) = 6(0.3)^1(0.7)^5 = 6 \times 0.3 \times 0.16807 = 0.302526$).

**(a)**
$$
P(X \le 2) = P(X=0)+P(X=1)+P(X=2) = 0.11765 + 0.30253 + 0.32413 = 0.74431
$$

**(b)** It is much quicker to use the complement than to add $P(X=4)$,
$P(X=5)$ and $P(X=6)$ directly. We need $P(X \ge 4) = 1 - P(X \le 3)$.
Continuing the list: $P(X=3) = \binom{6}{3}(0.3)^3(0.7)^3 = 20 \times 0.027
\times 0.343 = 0.18522$.

$$
P(X \le 3) = 0.74431 + 0.18522 = 0.92953
$$
$$
P(X \ge 4) = 1 - 0.92953 = 0.07047
$$
:::

:::callout{kind="tip"}
Always pause and ask which is shorter: adding up the terms you want
directly, or finding $1$ minus the terms you *don't* want. "At least"
questions with a small excluded tail (like $X \ge 4$ out of a possible 0–6)
are almost always faster via the complement.
:::

## Try it yourself: compute a binomial probability

Use the code runner below to check $P(X=r)$ for any $n$, $p$, $r$ you like —
edit the numbers and press Run. It computes $\binom{n}{r}$ from scratch
(without a library function) so you can see exactly how the formula is
evaluated.

::widget{type="code-runner" language="python" starter="def choose(n, r):\n    # n choose r, computed from scratch\n    num = 1\n    den = 1\n    for i in range(r):\n        num *= (n - i)\n        den *= (i + 1)\n    return num // den\n\nn = 6\np = 0.3\nr = 2\n\nc = choose(n, r)\nprob = c * p**r * (1 - p)**(n - r)\nprint(f\"C({n},{r}) = {c}\")\nprint(f\"P(X={r}) = {prob:.5f}\")" rows=14}

::widget{type="quiz" src="assessment.json" pick=4}
