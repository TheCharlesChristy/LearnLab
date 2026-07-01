# Disproof by counter-example

A **counter-example** is a single specific case for which a claimed general statement fails. If a statement says "for all $x$ in some set, $P(x)$ is true", then finding just **one** value of $x$ for which $P(x)$ is false is enough to disprove the whole statement — no matter how many other values do satisfy it.

:::callout{kind="key"}
Proving a "for all" statement true generally requires deduction (or exhaustion of every case). Disproving one requires only a **single** counter-example. The two tasks are not symmetric.
:::

## Worked example: "all prime numbers are odd"

**Claim:** every prime number is odd.

This is false. The number $2$ is prime (its only positive divisors are $1$ and $2$) and it is even. So $n = 2$ is a counter-example: it satisfies the hypothesis (it is prime) but not the conclusion (being odd).

:::reveal{title="Why does one example settle this?"}
The claim asserts something about *every* prime number. To disprove "for every prime $p$, $p$ is odd", it suffices to exhibit one prime that is not odd. $2$ is prime and even, so the claim is false. It doesn't matter that $3, 5, 7, 11, \ldots$ are all odd — one exception is enough.
:::

## Worked example: "n² + n + 1 is always prime"

**Claim:** for every positive integer $n$, the expression $n^2 + n + 1$ is prime.

Check small cases: $n=1$ gives $3$ (prime); $n=2$ gives $7$ (prime); $n=3$ gives $13$ (prime); $n=4$ gives $21$.

$$
n = 4: \quad 4^2 + 4 + 1 = 16 + 4 + 1 = 21 = 3 \times 7,
$$

which is not prime. So $n = 4$ is a counter-example, and the claim is false.

:::callout{kind="tip"}
This is the same lesson as Euler's $n^2 - n + 41$ from the first lesson: a formula can produce primes for many small inputs and still fail eventually. A single failing case is all that's needed to disprove "always prime".
:::

## Worked example: "the square of a number is always greater than the number"

**Claim:** for every real number $x$, $x^2 > x$.

Try $x = 0.5$: $x^2 = 0.25$, and $0.25 < 0.5$, so the claim fails. ($x = 0.5$ is a counter-example.) Also try $x = 0$: $0^2 = 0$, which is not *greater than* $0$ — a second, even simpler counter-example. Either value alone is sufficient to disprove the claim.

:::reveal{title="Where does the claim actually hold?"}
Solving $x^2 > x$ gives $x^2 - x > 0$, i.e. $x(x - 1) > 0$, which holds when $x < 0$ or $x > 1$. So the original claim is true for *some* real numbers but not for all of them — which is exactly why it is false as a "for all real $x$" statement, and exactly why a single counter-example in the range $0 \le x \le 1$ (such as $x = 0.5$) disproves it.
:::

## Worked example: a false divisibility claim

**Claim:** if $n$ is an integer and $n^2$ is divisible by $4$, then $n$ is divisible by $4$.

Try $n = 2$: $n^2 = 4$, which is divisible by $4$. But $n = 2$ itself is **not** divisible by $4$. So $n = 2$ is a counter-example — it satisfies the hypothesis ($n^2$ divisible by 4) but not the conclusion ($n$ divisible by 4) — and the claim is false.

:::callout{kind="info"}
The correct, provable statement is weaker: if $n^2$ is divisible by $4$ then $n$ is divisible by $2$ (i.e. $n$ is even). That version can be proved by deduction using the technique from the previous lessons.
:::

## Choosing the right technique

You now have all three tools. When you meet a claim, ask:

1. **Is it a "for all" claim over an infinite or unrestricted set, and do you believe it's true?** → Try **proof by deduction**: represent the general case algebraically and build a chain of justified steps.
2. **Does the claim only need checking over a small, finite, genuinely complete list of cases?** → Use **proof by exhaustion**.
3. **Do you suspect the claim is false, or does a quick trial value fail?** → Look for a **counter-example**; one failing case is enough to disprove it.

:::callout{kind="warning"}
A common error is to "prove" a general statement by checking a handful of examples that all work. Unless those examples are a genuinely exhaustive list of every case the statement covers, this is not a proof — it is only evidence. Always check whether you have covered every case (exhaustion/deduction) before declaring a statement proved.
:::
