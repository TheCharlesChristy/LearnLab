# The language of hypothesis testing

Earlier modules built up two tools: the **binomial distribution** $B(n, p)$ for counting successes in independent trials, and the **normal distribution**, which describes continuous data and underpins the broader idea of testing a claim against evidence. This module puts those tools to work: given a claim about a population proportion $p$, how do we decide — using data from a sample — whether the claim looks believable, or whether the evidence points the other way?

This is **hypothesis testing**. It's a formal, repeatable procedure for turning "the data looks a bit different from what was claimed" into a precise, defensible conclusion.

## Population proportion and sample proportion

Suppose a proportion $p$ of some population has a property of interest — a coin lands heads, a seed germinates, a customer renews a subscription. If we take a random sample of $n$ independent trials, the number of successes $X$ follows

$$
X \sim B(n, p).
$$

A claim about $p$ (from a manufacturer, a previous study, a "fair" assumption, etc.) can be tested by taking a sample, counting the number of successes $x$, and asking: *is this value of $x$ consistent with the claimed $p$, or surprising enough that we should doubt the claim?*

## Null and alternative hypotheses

Every hypothesis test starts with two statements about the population proportion $p$:

- The **null hypothesis** $H_0$ is the claim we test — always a statement of equality, $H_0: p = p_0$, where $p_0$ is a specific numerical value.
- The **alternative hypothesis** $H_1$ says what we conclude if the evidence goes against $H_0$. It can take three forms:
  - $H_1: p < p_0$ — a **one-tailed** test for a *decrease*.
  - $H_1: p > p_0$ — a **one-tailed** test for an *increase*.
  - $H_1: p \ne p_0$ — a **two-tailed** test for a *change in either direction*.

The choice between these depends entirely on the wording of the question. "A researcher believes the new drug increases the recovery rate" gives $H_1: p > p_0$. "A quality inspector wants to check whether the defect rate has changed" (no stated direction) gives $H_1: p \ne p_0$.

:::callout{kind="key"}
$H_0$ is always $p = p_0$. Decide the direction of $H_1$ from the **wording of the claim being investigated**, not from the sample data — the hypotheses must be fixed *before* looking at the result.
:::

## Significance level

The **significance level**, usually written $\alpha$ (common values: $10\%$, $5\%$, $1\%$), is the threshold of "how surprising is surprising enough". It is fixed in advance, before the sample is collected. Informally, it is the greatest probability we're willing to accept of wrongly rejecting a true $H_0$ purely due to natural sampling variation.

A test carried out "at the $5\\%$ level" means: we will reject $H_0$ only if the observed result would occur with probability at most $5\\%$ under $H_0$ — a result that rare is taken as evidence against the claim, in the direction specified by $H_1$.

:::reveal{title="Worked example: setting up a test"}
**Question.** A machine is set to produce components with a $25\%$ defect rate. After adjustments, an engineer wants to test whether the defect rate has *changed*. A random sample of components is taken. Set up the hypotheses.

**Solution.** Let $p$ be the true (post-adjustment) proportion of defective components. The claim under test is the original rate:

$$
H_0: p = 0.25
$$

The engineer has no reason to expect the change is specifically an increase or a decrease — only that it might have changed — so this calls for a two-tailed alternative:

$$
H_1: p \ne 0.25
$$

If instead the engineer suspected the adjustment specifically *reduced* the defect rate, the alternative would be one-tailed: $H_1: p < 0.25$.
:::

## Why the binomial distribution?

Because each trial (component, customer, seed, …) is independent and has a fixed probability of "success" under $H_0$, the number of successes in a fixed sample size $n$ is exactly binomial under $H_0$:

$$
X \sim B(n, p_0) \quad \text{if } H_0 \text{ is true.}
$$

This is what lets us calculate exact probabilities for how likely (or unlikely) an observed sample result would be if the claim $p = p_0$ were true — the basis of every calculation in the next two lessons.

::widget{type="data-plot" src="data/binomial-distribution-n15-p03.json"}

The chart shows $P(X = k)$ for $X \sim B(15, 0.3)$ — the distribution of the number of successes in $15$ trials if the true proportion really is $p_0 = 0.3$. Small values of $k$ (far in the left tail) are individually unlikely; it is exactly this kind of "unlikely under $H_0$" region that a hypothesis test formalises as the *critical region*, the subject of the next lesson.

:::callout{kind="tip"}
A hypothesis test never *proves* $H_0$ true or false. It only tells you whether the sample data is (or is not) statistically **significant** evidence against $H_0$, at the chosen significance level.
:::
