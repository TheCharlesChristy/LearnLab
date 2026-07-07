# Proof by exhaustion

Some statements cannot easily be proved by a single general algebraic argument, but only involve a small, finite number of cases. **Proof by exhaustion** proves such a statement by checking that it holds in *every single one* of those cases, with none left out.

:::callout{kind="key"}
Proof by exhaustion is only valid if the list of cases you check is genuinely complete — every possibility the statement covers must be included, usually because the statement can be split into a small number of categories (e.g. "every integer is even or odd", or "every integer leaves remainder 0, 1 or 2 when divided by 3").
:::

## Worked example: n² + n is even for every integer 0 ≤ n ≤ 4

**Claim:** for every integer $n$ with $0 \le n \le 4$, the value of $n^2 + n$ is even.

Since $n$ only ranges over the five values $0, 1, 2, 3, 4$, we can simply check each one:

| $n$ | $n^2 + n$ | Even? |
|---|---|---|
| 0 | $0 + 0 = 0$ | Yes |
| 1 | $1 + 1 = 2$ | Yes |
| 2 | $4 + 2 = 6$ | Yes |
| 3 | $9 + 3 = 12$ | Yes |
| 4 | $16 + 4 = 20$ | Yes |

Every case in the finite range $0 \le n \le 4$ has been checked and each gives an even result, so the claim is proved **for this range** by exhaustion.

:::reveal{title="Why can't we claim this proves n² + n is even for ALL integers?"}
We only checked five specific values. Proof by exhaustion is valid *only* over the finite range actually stated in the claim — here, $0 \le n \le 4$. If the claim had instead been "for all integers $n$", checking five values would not be a proof by exhaustion (the case list is infinite, hence not exhaustible this way); you would need proof by deduction instead. In fact $n^2 + n = n(n+1)$ is a product of consecutive integers, which the previous lesson proved is always even by deduction — that argument *does* cover every integer.
:::

## Worked example: checking all cases modulo 3

**Claim:** for every integer $n$, the value $n^2$ leaves remainder $0$ or $1$ when divided by $3$ (never remainder $2$).

Every integer falls into exactly one of three categories, depending on its remainder on division by 3: it can be written as $3k$, $3k+1$, or $3k+2$ for some integer $k$. This is a genuinely exhaustive split — there is no fourth option. Check each case:

- **Case $n = 3k$:** $n^2 = 9k^2 = 3(3k^2)$, which has remainder $0$.
- **Case $n = 3k+1$:** $n^2 = 9k^2 + 6k + 1 = 3(3k^2 + 2k) + 1$, which has remainder $1$.
- **Case $n = 3k+2$:** $n^2 = 9k^2 + 12k + 4 = 3(3k^2 + 4k + 1) + 1$, which has remainder $1$.

Every integer belongs to exactly one of these three cases, and in each case $n^2$ leaves remainder $0$ or $1$. Since the three cases exhaust all possibilities, the claim is proved for **every** integer $n$. $\blacksquare$

:::callout{kind="tip"}
This example is a hybrid: exhaustion is used to cover the finite number of *categories* (three remainder classes), while deduction (general algebra with $k$) is used *within* each category to cover the infinitely many integers in that category. Many exam-style exhaustion proofs work this way — a finite number of algebraic cases, each argued in general.
:::

## When to use exhaustion rather than deduction

Choose proof by exhaustion when:

- the statement explicitly restricts $n$ (or another variable) to a small finite set, e.g. "for all prime numbers less than 10", or
- the statement can be split into a small, genuinely complete list of cases (such as odd/even, or remainder 0/1/2 mod 3), each of which can be checked in general.

If the number of cases is too large to list and check individually (or is infinite with no natural finite split), exhaustion is impractical — deduction is the right tool instead.
