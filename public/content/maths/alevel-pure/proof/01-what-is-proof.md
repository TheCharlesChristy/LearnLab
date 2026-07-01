# What is a mathematical proof?

In mathematics, a **statement** is a sentence that is either true or false — for example, "every even number greater than 2 is the sum of two primes" or "$n^2 - n + 41$ is prime for every positive integer $n$". A **proof** is a logically watertight argument that shows a statement is true in *every* case it covers, starting only from things we already know: definitions, previously proved results, or basic logical rules.

This matters because checking examples is not the same as proving something. If a statement claims something is true for *all* integers, or *all* triangles, or *all* values of $x$, then trying it for 1, 2, 3, 4, 5 and finding it works every time tells you the pattern is *plausible* — but not that it is certain. Somewhere beyond the numbers you tried, the pattern might break.

:::callout{kind="key"}
A proof must cover every case the statement claims to cover. A finite number of successful examples can suggest a result is true, but (except when exhaustion covers literally every case) it can never *prove* a general statement — because there might always be an untried case where it fails.
:::

## A classic warning: Euler's near-miss

Consider the expression $n^2 - n + 41$. Try a few values:

- $n = 1$: $1 - 1 + 41 = 41$ (prime)
- $n = 2$: $4 - 2 + 41 = 43$ (prime)
- $n = 3$: $9 - 3 + 41 = 47$ (prime)

In fact this expression gives a prime number for every integer $n$ from $1$ to $40$ — forty examples in a row. It would be easy to conjecture "$n^2 - n + 41$ is always prime". But at $n = 41$:

$$
41^2 - 41 + 41 = 41^2,
$$

which is certainly not prime (it's $41 \times 41$). Forty correct examples, then a failure. This is exactly why mathematicians insist on **proof**, not just pattern-spotting.

:::reveal{title="Why does the pattern break at n = 41?"}
For any value of $n$ that is a multiple of $41$, say $n = 41$, the expression becomes
$$
n^2 - n + 41 = 41^2 - 41 + 41 = 41^2,
$$
which is divisible by $41$ and bigger than $41$, so it cannot be prime. The formula was "designed" (via how it's constructed) to avoid small factors up to that point, which is exactly why so many small cases are prime before the pattern fails.
:::

## Three techniques you will use throughout A-level

This module introduces the three proof techniques you'll rely on across the whole course:

1. **Proof by deduction** — build a chain of algebraic or logical steps from known facts to the conclusion. This is the main technique for "prove that…" questions.
2. **Proof by exhaustion** — when a statement only needs checking over a small, finite number of cases (e.g. all integers from 1 to 20, or all remainders when dividing by 3), check every single one.
3. **Disproof by counter-example** — to show a general "for all" claim is *false*, it is enough to find just **one** case where it fails.

Use the flashcards below to fix the key vocabulary before moving on — you'll need these terms precisely in the lessons that follow.

::widget{type="flashcards" src="cards/proof-terminology.json"}

:::callout{kind="tip"}
Notice the asymmetry: proving a "for all" statement true generally requires deduction (or exhaustion of every case), but disproving a "for all" statement only ever requires **one** counter-example.
:::
