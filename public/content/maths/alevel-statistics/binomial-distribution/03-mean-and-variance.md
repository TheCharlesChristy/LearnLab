# Mean and variance of a binomial distribution

The full probability formula lets you answer *any* question about
$X \sim B(n,p)$, but there are two summary numbers you should be able to
write down immediately, without doing any sum: the **mean** (expected
number of successes) and the **variance** (a measure of spread).

## The formulas

:::callout{kind="key"}
If $X \sim B(n, p)$, then
$$
E(X) = \mu = np \qquad \text{and} \qquad \operatorname{Var}(X) = \sigma^2 = np(1-p).
$$
The standard deviation is $\sigma = \sqrt{np(1-p)}$.
:::

You don't need to prove these results at this stage (they follow from
treating $X$ as a sum of $n$ independent "0 or 1" trials, which you may meet
later), but you must be able to **apply** them quickly and accurately —
these are some of the most frequently tested results in the whole topic.

## Why $np$ makes sense

If you toss a fair coin ($p = 0.5$) 10 times, you'd expect around $10 \times
0.5 = 5$ heads — that matches everyday intuition. If a component has a
$0.2$ chance of being faulty and you test 10 of them, you'd expect around
$10 \times 0.2 = 2$ faulty components on average. In general, over $n$
trials each contributing "on average" $p$ of a success, the total expected
successes is $np$.

## A worked example

:::reveal{title="Worked example — mean and variance"}
**A biased coin has $P(\text{heads}) = 0.3$ and is tossed 6 times. Let $X$
be the number of heads. Find the mean and variance of $X$, and hence its
standard deviation.**

Here $X \sim B(6, 0.3)$, so $n = 6$ and $p = 0.3$.

$$
E(X) = np = 6 \times 0.3 = 1.8
$$

$$
\operatorname{Var}(X) = np(1-p) = 6 \times 0.3 \times 0.7 = 1.8 \times 0.7 = 1.26
$$

$$
\sigma = \sqrt{1.26} \approx 1.1225 \text{ (4 d.p.)}
$$

So although $X$ can only take whole-number values $0$ to $6$, over many
repeats of "toss the coin 6 times" the *average* number of heads is $1.8$,
and typical runs deviate from that average by around $1.12$.
:::

:::callout{kind="warning"}
$np(1-p)$ is always **less than** $np$ (since $0 < 1-p < 1$ whenever $0 < p <
1$), and the variance is at its largest, relative to $n$, when $p = 0.5$.
Do not confuse $\operatorname{Var}(X) = np(1-p)$ with the standard deviation
$\sigma = \sqrt{np(1-p)}$ — a very common slip is to give the variance when
a question asks for the standard deviation, or vice versa. Always check
which one the question wants.
:::

## Second worked example, with different parameters

:::reveal{title="Worked example — a second pair of parameters"}
**A large batch of components has a $20\%$ defect rate. A random sample of
10 components is tested, and $X$ is the number of defective components in
the sample. Find $E(X)$ and $\operatorname{Var}(X)$.**

Here $X \sim B(10, 0.2)$ (the batch is large, so sampling doesn't
meaningfully change the defect rate — the constant-$p$/independence
conditions are reasonable). So $n = 10$, $p = 0.2$, and $1 - p = 0.8$.

$$
E(X) = np = 10 \times 0.2 = 2
$$

$$
\operatorname{Var}(X) = np(1-p) = 10 \times 0.2 \times 0.8 = 1.6
$$

On average, 2 components out of every 10 are defective, with variance
$1.6$ (standard deviation $\sqrt{1.6} \approx 1.265$).
:::

## Putting it all together

By this point you should be able to:

1. Check whether $B(n,p)$ is a valid model (Lesson 1).
2. Compute any individual or cumulative probability from the formula
   $P(X=r) = \binom{n}{r}p^r(1-p)^{n-r}$ (Lesson 2).
3. Write down the mean $np$ and variance $np(1-p)$ immediately, without
   summing the whole distribution (this lesson).

The end-of-module assessment mixes all three skills — including deciding
whether a binomial model applies at all before you calculate anything.

::widget{type="quiz" src="assessment.json" pick=4}
