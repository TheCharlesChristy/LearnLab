# Inverse normal, and approximating a binomial

So far you have gone from a value $x$ to a probability. This lesson runs the process in reverse — from a probability to a value — and then (as an extension) shows how the normal distribution can stand in for a binomial distribution when $n$ is large.

## Inverse normal: finding $a$ given a probability

Suppose you know $P(X < a) = p$ for some given probability $p$, and you need $a$. The method:

1. Find the $z$-value such that $\Phi(z) = p$ (from tables/calculator "inverse normal" function — this reads the table backwards).
2. Un-standardise: $a = \mu + z\sigma$.

Some standard inverse values worth recognising:

| $\Phi(z) = p$ | $z$ |
|---|---|
| $0.90$ | $1.2816$ |
| $0.95$ | $1.6449$ |
| $0.975$ | $1.9600$ |
| $0.99$ | $2.3263$ |

:::reveal{title="Worked example: inverse normal"}
Exam scores are $X \sim N(65, 12^2)$. The top $10\%$ of students receive a distinction. What score is needed?

"Top $10\%$" means $P(X > a) = 0.10$, so $P(X < a) = 0.90$. We need $z$ with $\Phi(z) = 0.90$; from the table, $z = 1.2816$.

$$
a = \mu + z\sigma = 65 + 1.2816 \times 12 = 65 + 15.3792 = 80.38
$$

So a score of about $80.4$ (or higher) earns a distinction.

**Lower tail version.** What score marks the lower quartile ($P(X<a)=0.25$)? By symmetry, the $z$ for $\Phi(z)=0.75$ is $0.6745$, so for the *lower* tail $z=-0.6745$:

$$
a = 65 + (-0.6745)(12) = 65 - 8.094 = 56.91
$$
:::

:::callout{kind="tip"}
Always check whether the question gives you $P(X<a)$ directly, or gives you a "top" / "bottom" percentage that you must convert into $P(X<a)$ first (as in the distinction example above, where "top 10%" became $\Phi(z) = 0.90$, not $0.10$).
:::

## Extension: approximating a binomial by a normal distribution

A binomial variable $X \sim B(n,p)$ is **discrete** (whole-number outcomes only), but when $n$ is large, its distribution becomes bell-shaped and can be closely approximated by a **continuous** normal distribution. This matters because binomial probabilities with large $n$ are painful to compute exactly (they need many individual terms), while the normal approximation reduces the work to one standardise-and-look-up step.

**Conditions (a common rule of thumb):** the approximation is good when $n$ is large and $p$ is not too close to $0$ or $1$ — typically both $np > 5$ and $n(1-p) > 5$.

**Matching moments.** If $X \sim B(n,p)$, approximate with $Y \sim N(\mu, \sigma^2)$ where

$$
\mu = np, \qquad \sigma^2 = np(1-p)
$$

**Continuity correction.** Because $X$ is discrete but $Y$ is continuous, we widen each whole-number boundary by $0.5$ before standardising — e.g. $P(X \le k)$ becomes $P(Y < k+0.5)$, and $P(X \ge k)$ becomes $P(Y > k - 0.5)$.

| Binomial event | Normal approximation |
|---|---|
| $P(X \le k)$ | $P(Y < k+0.5)$ |
| $P(X < k)$ | $P(Y < k-0.5)$ |
| $P(X \ge k)$ | $P(Y > k-0.5)$ |
| $P(X > k)$ | $P(Y > k+0.5)$ |

::widget{type="data-plot" src="binomial-vs-normal.json"}

The chart compares the binomial probabilities $P(X=k)$ for $X \sim B(20, 0.5)$ against the smooth normal density with the matching mean and variance ($\mu=10$, $\sigma^2=5$) — this is the "large $n$" bell shape the approximation relies on.

:::reveal{title="Worked example: normal approximation to binomial"}
$X \sim B(120, 0.5)$. Estimate $P(X \le 65)$.

Check conditions: $np = 60 > 5$ and $n(1-p) = 60 > 5$. ✓.

Matching moments: $\mu = np = 60$, $\sigma^2 = np(1-p) = 120 \times 0.5 \times 0.5 = 30$, so $\sigma = \sqrt{30} = 5.477$.

Apply the continuity correction: $P(X \le 65) \approx P(Y < 65.5)$.

$$
z = \frac{65.5 - 60}{\sqrt{30}} = \frac{5.5}{5.477} = 1.004
$$

$$
P(Y<65.5) = \Phi(1.004) \approx 0.8423
$$

So $P(X \le 65) \approx 0.842$.
:::

:::callout{kind="warning"}
Forgetting the continuity correction is the single most common exam error here — always convert the discrete boundary ($\le$, $<$, $\ge$, $>$) to the correct continuous one (see the table above) before standardising.
:::

## Summary of the module

- $X \sim N(\mu,\sigma^2)$ models continuous, symmetric, bell-shaped data.
- Standardise with $z = \dfrac{x-\mu}{\sigma}$ to convert to $Z \sim N(0,1)$.
- $\Phi(z) = P(Z<z)$; use $1-\Phi(z)$ for "greater than", and a difference of two $\Phi$ values for "between".
- To invert, look up $z$ for a given $\Phi(z)$, then un-standardise: $a = \mu + z\sigma$.
- For large $n$, $B(n,p) \approx N(np,\, np(1-p))$, with a $\pm 0.5$ continuity correction.
