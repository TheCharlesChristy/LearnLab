# Finding a critical region from the binomial distribution

## What is a critical region?

The **critical region** (also called the **rejection region**) is the set of values of the test statistic $X$ that are unlikely enough under $H_0$ — at the chosen significance level $\alpha$ — that we would reject $H_0$ in favour of $H_1$ if the observed value falls inside it. Everywhere else is the **acceptance region**, where the data is judged consistent with $H_0$.

The shape of the critical region matches the tail(s) of $H_1$:

- $H_1: p < p_0$ → critical region is a set of **small** values, $X \le c$ (lower tail).
- $H_1: p > p_0$ → critical region is a set of **large** values, $X \ge c$ (upper tail).
- $H_1: p \ne p_0$ → critical region has **two parts**, one in each tail, usually splitting $\alpha$ equally between them ($\alpha/2$ each).

## Finding a one-tailed critical region

Suppose $H_0: p = p_0$ is tested against $H_1: p < p_0$ at significance level $\alpha$, with sample size $n$. Under $H_0$, $X \sim B(n, p_0)$. We want the **largest** value $c$ such that

$$
P(X \le c) \le \alpha.
$$

We look for the largest $c$ (not just any $c$) because we want the critical region as large as possible while still keeping the actual probability of wrongly rejecting a true $H_0$ at or below $\alpha$ — using every bit of the allowed significance level without exceeding it.

:::reveal{title="Worked example: lower-tail critical region"}
**Question.** A supplier claims that $30\%$ of seeds germinate. A gardener wants to test, at the $5\%$ level, whether the true germination rate is *lower* than claimed, using a sample of $n = 15$ seeds. Find the critical region.

**Solution.** Let $p$ be the true germination probability. The hypotheses are

$$
H_0: p = 0.3, \qquad H_1: p < 0.3.
$$

Under $H_0$, the number of seeds that germinate is $X \sim B(15, 0.3)$. Since $H_1$ points to smaller values, we need the largest $c$ with $P(X \le c) \le 0.05$. Computing cumulative probabilities:

$$
P(X \le 0) = 0.0047, \quad P(X \le 1) = 0.0353, \quad P(X \le 2) = 0.1268.
$$

Since $P(X \le 1) = 0.0353 \le 0.05$ but $P(X \le 2) = 0.1268 > 0.05$, the critical region is

$$
X \le 1,
$$

with actual significance level $3.53\%$ (the largest achievable value not exceeding $5\%$, since the binomial distribution is discrete and we generally cannot hit $\alpha$ exactly).
:::

## Finding an upper-tail critical region

For $H_1: p > p_0$, the critical region is the set of **large** values. We want the smallest $c$ such that

$$
P(X \ge c) \le \alpha.
$$

Because tables and calculators usually give $P(X \le k)$ rather than $P(X \ge k)$ directly, it's often easier to work with the complement: $P(X \ge c) = 1 - P(X \le c - 1)$.

:::reveal{title="Worked example: upper-tail critical region"}
**Question.** A call centre claims $50\%$ of calls are resolved on the first attempt. A manager suspects a new training programme has *increased* this rate, and tests at the $5\%$ level with a sample of $n = 25$ calls. Find the critical region.

**Solution.** Let $p$ be the true first-call resolution rate after training. The hypotheses are

$$
H_0: p = 0.5, \qquad H_1: p > 0.5.
$$

Under $H_0$, $X \sim B(25, 0.5)$, and we need the smallest $c$ with $P(X \ge c) \le 0.05$. Using $P(X \ge c) = 1 - P(X \le c-1)$:

$$
P(X \ge 18) = 1 - P(X \le 17) = 1 - 0.9784 = 0.0216,
$$
$$
P(X \ge 17) = 1 - P(X \le 16) = 1 - 0.9461 = 0.0539.
$$

Since $P(X \ge 18) = 0.0216 \le 0.05$ but $P(X \ge 17) = 0.0539 > 0.05$, the critical region is

$$
X \ge 18,
$$

with actual significance level $2.16\%$.
:::

## Two-tailed critical regions

For $H_1: p \ne p_0$, split $\alpha$ equally between the two tails (unless told otherwise), giving a lower critical region found from $P(X \le c_1) \le \alpha/2$ and an upper one from $P(X \ge c_2) \le \alpha/2$. The overall critical region is $X \le c_1$ **or** $X \ge c_2$.

:::callout{kind="warning"}
Because the binomial distribution only takes integer values, it is usually **impossible** to make the tail probability exactly equal to $\alpha$ (or $\alpha/2$). Always choose the critical value so the actual tail probability is **as close to, but not exceeding,** the target — never round the probability up past $\alpha$.
:::

::widget{type="step-reveal" src="steps/worked-test-n20-p04.json"}

The steps above walk through a complete lower-tail test end to end — hypotheses, critical region, decision, and conclusion in context — which is exactly the process the next lesson formalises for the decision and conclusion stage.

:::callout{kind="info"}
A critical region is always found using $p_0$ (the value in $H_0$), **never** using any value estimated from the sample. The sample proportion only comes in afterwards, to decide whether the observed $x$ falls inside the critical region.
:::
