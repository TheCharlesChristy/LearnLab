# Drawing conclusions, p-values, and Type I/II errors

## Making the decision

Once the critical region has been found, testing is mechanical:

1. Compare the observed value $x$ to the critical region.
2. If $x$ lies **inside** the critical region, **reject $H_0$** — the result is *significant* at the stated level.
3. If $x$ lies **outside** the critical region, **do not reject $H_0$** — there is *insufficient evidence* to support $H_1$.

:::callout{kind="warning"}
"Do not reject $H_0$" is not the same as "prove $H_0$ is true". It only means the sample gave no strong enough evidence against it. Never write "accept $H_0$" — always phrase it as *insufficient evidence to reject*.
:::

Every conclusion must be written **in the context of the question** — not just "reject $H_0$", but what that means for the claim being tested.

:::reveal{title="Worked example: full test with conclusion"}
**Question.** A dice manufacturer claims a die is fair, so the probability of rolling a six is $p = \frac{1}{6}$. A trading-standards officer suspects the die is biased towards rolling *fewer* sixes than a fair die would give. In $30$ rolls, a six occurs $2$ times. Test at the $5\%$ level.

**Solution.** Let $p$ be the true probability of rolling a six. The hypotheses are

$$
H_0: p = \tfrac{1}{6}, \qquad H_1: p < \tfrac{1}{6}.
$$

Under $H_0$, $X \sim B(30, \tfrac16)$, and since $H_1$ is one-tailed (lower), find the largest $c$ with $P(X \le c) \le 0.05$:

$$
P(X \le 1) = 0.0295, \qquad P(X \le 2) = 0.1028.
$$

So the critical region is $X \le 1$ (actual significance level $2.95\%$). The observed value is $x = 2$, which is **not** in the critical region $X \le 1$.

**Conclusion.** There is insufficient evidence, at the $5\%$ level, to reject $H_0$. The data does not support the claim that the die is biased towards fewer sixes; it is consistent with the die being fair.
:::

## The p-value

An alternative (and equivalent) way to reach the same decision is to compute a **p-value**: the probability, calculated under $H_0$, of a result **at least as extreme** as the one observed, in the direction of $H_1$.

- For $H_1: p < p_0$ with observed value $x$: $\text{p-value} = P(X \le x)$.
- For $H_1: p > p_0$ with observed value $x$: $\text{p-value} = P(X \ge x)$.
- For $H_1: p \ne p_0$: double the one-tailed p-value (capped at $1$).

The decision rule becomes:

$$
\text{p-value} \le \alpha \implies \text{reject } H_0, \qquad \text{p-value} > \alpha \implies \text{do not reject } H_0.
$$

This always gives the *same* conclusion as the critical-region method, because "$x$ is inside the critical region" and "the p-value is $\le \alpha$" are two descriptions of the same event.

:::reveal{title="Worked example: using the p-value directly"}
**Question.** A political pollster claims $50\%$ of voters support a proposal. A campaigner tests, at the $5\%$ level, whether support is *lower* than claimed, sampling $n = 20$ voters and finding $x = 6$ in favour. Use a p-value to decide.

**Solution.** Hypotheses: $H_0: p = 0.5$, $H_1: p < 0.5$. Under $H_0$, $X \sim B(20, 0.5)$.

$$
\text{p-value} = P(X \le 6) = 0.0577.
$$

Since $0.0577 > 0.05$, the p-value exceeds the significance level, so we do **not** reject $H_0$.

**Conclusion.** There is insufficient evidence, at the $5\%$ level, that support for the proposal is below $50\%$.

(Check against the critical-region method: $P(X \le 5) = 0.0207 \le 0.05$ but $P(X \le 6) = 0.0577 > 0.05$, so the critical region is $X \le 5$. Since $6$ is *not* in $X \le 5$, we again do not reject $H_0$ — the two methods agree, as they always must.)
:::

::widget{type="quiz" src="assessment.json" pick=8}

## Type I and Type II errors

Because a hypothesis test is a decision based on a random sample, it can be wrong in two distinct ways:

|                        | $H_0$ is actually true      | $H_0$ is actually false      |
|------------------------|------------------------------|-------------------------------|
| **Reject $H_0$**       | **Type I error**              | Correct decision               |
| **Do not reject $H_0$**| Correct decision               | **Type II error**             |

- A **Type I error** occurs when we reject a true $H_0$ — we conclude the claim is wrong when it was actually right. By construction, $P(\text{Type I error}) \le \alpha$: this is exactly why the significance level exists, and it is generally close to $\alpha$ but not always exactly equal to it, because the critical region's actual tail probability is often slightly less than $\alpha$ (the binomial distribution is discrete).
- A **Type II error** occurs when we fail to reject a false $H_0$ — the claim is actually wrong, but the sample didn't give enough evidence to detect it. Its probability depends on the true (unknown) value of $p$ and is generally harder to calculate; at A-level, you are mainly expected to **identify** a Type II error in context rather than calculate its exact probability.

:::callout{kind="key"}
Type I error: **rejecting a true $H_0$** (a "false alarm"). Type II error: **failing to reject a false $H_0$** (a "missed detection"). Lowering $\alpha$ reduces the chance of a Type I error but increases the chance of a Type II error, for a fixed sample size — there is always a trade-off.
:::

:::reveal{title="Worked example: identifying the errors"}
**Question.** A vaccine is claimed to be effective for $80\%$ of patients ($H_0: p = 0.8$). A trial tests $H_1: p < 0.8$ at the $5\%$ level. Describe what a Type I error and a Type II error would mean in this context.

**Solution.**

- **Type I error:** the trial's sample data leads to rejecting $H_0$ (concluding the vaccine is less effective than $80\%$), when in fact the vaccine really is $80\%$ effective. A perfectly good vaccine gets wrongly judged as under-performing.
- **Type II error:** the trial's sample data leads to *not* rejecting $H_0$ (concluding there's insufficient evidence the vaccine is less effective), when in fact the true effectiveness genuinely is below $80\%$. A vaccine that really is under-performing escapes detection.
:::

With hypotheses, critical regions, p-values, decisions and errors all in place, you now have the complete machinery of a binomial hypothesis test — the same reasoning pattern (state $H_0$/$H_1$, fix $\alpha$, find the critical region or p-value, compare, conclude in context) extends to every hypothesis test met later, including tests based on the normal distribution.
