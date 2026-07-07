# Arithmetic sequences and series

A **sequence** is an ordered list of numbers, called **terms**. In an **arithmetic sequence**, you get from one term to the next by adding a fixed number each time, called the **common difference**, $d$.

For example, $3, 7, 11, 15, 19, \ldots$ is arithmetic with common difference $d = 4$: each term is $4$ more than the one before.

## The nth term

If the first term is $a$ and the common difference is $d$, the $n$th term is

$$
u_n = a + (n-1)d.
$$

This works because to reach the $n$th term from the first term you add $d$ exactly $n-1$ times.

:::callout{kind="key"}
Arithmetic sequence, $n$th term: $u_n = a + (n-1)d$, where $a$ is the first term and $d$ is the common difference.
:::

The bar chart below shows the sequence $u_n = 3 + 4(n-1)$ (so $a = 3$, $d = 4$) for $n = 1$ to $7$ — notice the terms increase by the same amount, $4$, at every step.

::widget{type="data-plot" src="data/arithmetic-terms.json"}

:::reveal{title="Worked example: finding a term and the common difference"}
The 2nd term of an arithmetic sequence is $11$ and the 5th term is $23$.

Since $u_5 - u_2 = 3d$ (three steps of $d$ apart):

$$
3d = 23 - 11 = 12 \implies d = 4.
$$

Using $u_2 = a + d = 11$: $a = 11 - 4 = 7$.

So $a = 7$, $d = 4$, and $u_n = 7 + 4(n-1) = 4n + 3$.

Check: $u_2 = 4(2) + 3 = 11$ ✓, $u_5 = 4(5) + 3 = 23$ ✓.
:::

## Arithmetic series

An **arithmetic series** is the sum of the terms of an arithmetic sequence. Let $S_n$ denote the sum of the first $n$ terms:

$$
S_n = u_1 + u_2 + \cdots + u_n.
$$

Writing the sum forwards and backwards and adding the two versions term by term (Gauss's trick) gives:

$$
S_n = \frac{n}{2}\big(2a + (n-1)d\big),
$$

which can also be written as $S_n = \dfrac{n}{2}(a + l)$, where $l = u_n$ is the last (nth) term — the sum is $n$ times the **average** of the first and last term.

:::callout{kind="key"}
Arithmetic series sum: $S_n = \dfrac{n}{2}\big(2a + (n-1)d\big) = \dfrac{n}{2}(a + l)$.
:::

:::reveal{title="Worked example: sum of an arithmetic series"}
Find the sum of the first $20$ terms of the arithmetic sequence with first term $a = 5$ and common difference $d = 3$.

$$
S_{20} = \frac{20}{2}\big(2(5) + (20-1)(3)\big) = 10\big(10 + 57\big) = 10 \times 67 = 670.
$$

Check using $S_n = \frac{n}{2}(a+l)$: the 20th term is $l = 5 + 19(3) = 62$, so $S_{20} = \frac{20}{2}(5 + 62) = 10 \times 67 = 670$. ✓
:::

:::callout{kind="tip"}
If a question gives you two terms of a sequence, form two simultaneous equations in $a$ and $d$ using $u_n = a + (n-1)d$, then solve. This is the most common exam technique for arithmetic sequences.
:::

## Practice

Try the questions below, then move on to geometric sequences and series.

::widget{type="quiz" src="assessment.json" pick=4}
