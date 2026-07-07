# Proof by deduction

**Proof by deduction** builds a rigorous chain of algebraic or logical steps, each one following necessarily from the last, starting from agreed definitions or known facts and ending at the statement you want to establish. Because every step is general (no specific numbers are substituted), the conclusion holds for *every* case the statement covers.

## Representing integers algebraically

Deductive proofs about integers almost always start by writing the objects involved in a general algebraic form:

| Type of integer | Algebraic form |
|---|---|
| Even integer | $2n$, for some integer $n$ |
| Odd integer | $2n + 1$ (or $2n - 1$), for some integer $n$ |
| Two consecutive integers | $n$ and $n + 1$ |
| Two consecutive even integers | $2n$ and $2n + 2$ |
| Multiple of 3 | $3n$ |

Because $n$ stands for *any* integer, an algebraic argument built from these forms automatically applies to every case — that is what makes it a proof rather than a collection of examples.

## Worked example: the sum of two odd numbers is even

Step through the full deduction below.

::widget{type="step-reveal" src="steps/sum-of-two-odds.json"}

## Worked example: completing the square

Deduction is not limited to number theory — it is the standard technique for proving algebraic identities and inequalities too.

:::reveal{title="Worked example: prove that x² − 6x + 11 is always positive"}
**Claim:** $x^2 - 6x + 11 > 0$ for all real $x$.

Complete the square on the left-hand side:
$$
x^2 - 6x + 11 = (x - 3)^2 - 9 + 11 = (x - 3)^2 + 2.
$$

Now reason about each piece:

- $(x-3)^2 \ge 0$ for every real $x$, since a real square can never be negative.
- Adding $2$ to a non-negative number gives a result that is at least $2$.

So $(x-3)^2 + 2 \ge 2 > 0$ for every real $x$. Hence $x^2 - 6x + 11 > 0$ for all real $x$. $\blacksquare$

Notice the deductive structure: each line follows necessarily from the one before, from the general algebraic identity $(x-3)^2 \ge 0$ (true for *every* $x$) all the way to the required conclusion.
:::

## Worked example: the product of two consecutive integers is even

:::callout{kind="info"}
This example shows how choosing the right algebraic representation makes a proof almost immediate.
:::

Let the two consecutive integers be $n$ and $n + 1$, for some integer $n$. Exactly one of $n$ and $n+1$ is even (they alternate in parity), so their product $n(n+1)$ contains a factor of $2$. Formally:

- If $n$ is even, $n = 2k$ for some integer $k$, so $n(n+1) = 2k(n+1) = 2\big(k(n+1)\big)$, which is even.
- If $n$ is odd, then $n + 1$ is even, so $n + 1 = 2k$ for some integer $k$, so $n(n+1) = n \cdot 2k = 2(nk)$, which is even.

Either way, $n(n+1)$ is $2 \times (\text{an integer})$, so it is even. Because these two cases (n even, n odd) are the *only* possibilities for an integer, together they form a complete deductive argument covering every consecutive pair.

:::callout{kind="key"}
A deductive proof must justify **every** step from definitions or previously established facts. A step that merely "looks true" or that only checks a particular number is not a valid link in the chain.
:::
