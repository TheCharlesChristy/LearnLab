# Logistic regression: weighted sum, sigmoid, threshold

**Logistic regression** fixes the problem from the last lesson in two steps: compute the same kind of weighted sum used in linear regression, then squash it through a function that always returns a number in $(0, 1)$.

## Step 1: the weighted sum

Exactly as in linear regression, we combine the feature(s) $x$ with a weight $w$ and a bias $b$ into a single number, the **pre-activation** $z$:

$$
z = wx + b.
$$

(With several features $x_1, \dots, x_n$ this generalises to $z = w_1 x_1 + \dots + w_n x_n + b$, but one feature is enough to see every idea in this lesson.) On its own, $z$ is unbounded — it can be any real number, which is exactly the problem from the previous lesson.

## Step 2: squash with the sigmoid

To turn $z$ into something we can read as a probability, logistic regression passes it through the **logistic sigmoid** function:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}.
$$

The sigmoid squashes *any* real number into the open interval $(0, 1)$:

| $z$ | $\sigma(z)$ |
| --- | --- |
| very negative | $\to 0$ |
| $-2$ | $0.119$ |
| $0$ | $0.5$ |
| $2$ | $0.881$ |
| very positive | $\to 1$ |

We read $\sigma(z)$ as the model's predicted **probability that the example belongs to class $1$**. Note $\sigma(0) = \frac{1}{1+e^{0}} = \frac{1}{2} = 0.5$ — when the weighted sum is exactly zero, the model is maximally undecided between the two classes.

:::callout{kind="key"}
Logistic regression in one line: compute $z = wx + b$ (same as linear regression), then output $\sigma(z) = \dfrac{1}{1+e^{-z}}$ — a probability in $(0, 1)$ that the example is class $1$.
:::

## Step 3: the decision threshold

A probability alone is not yet a *prediction*. To get one, we apply a **decision threshold**, conventionally $0.5$:

$$
\hat{y} = \begin{cases} 1 & \text{if } \sigma(z) \ge 0.5, \\ 0 & \text{if } \sigma(z) < 0.5. \end{cases}
$$

Because $\sigma(z) \ge 0.5$ exactly when $z \ge 0$ (check the table above), the threshold rule is equivalent to just checking the *sign* of $z$: predict class $1$ if $z \ge 0$, else class $0$. The threshold need not always be $0.5$ — for example, a medical screening test might deliberately use a lower threshold such as $0.3$ so that fewer true cases are missed, at the cost of more false alarms — but $0.5$ is the default and the one we use throughout this module.

## A worked example: pass or fail

Suppose we model whether a student passes ($1$) or fails ($0$) an exam from the number of hours studied, $x$, using weight $w = 1$ and bias $b = -3$.

For a student who studied $x = 5$ hours:

$$
z = (1)(5) + (-3) = 2, \qquad \sigma(2) = \frac{1}{1 + e^{-2}} \approx 0.881.
$$

Since $0.881 \ge 0.5$, the model predicts $\hat{y} = 1$ (pass).

:::reveal{title="Worked example: a student who studied less"}
Same model, $w = 1$, $b = -3$. A student studied $x = 1$ hour.

**Weighted sum:**

$$
z = (1)(1) + (-3) = 1 - 3 = -2.
$$

**Sigmoid probability:**

$$
\sigma(-2) = \frac{1}{1 + e^{2}} \approx \frac{1}{1 + 7.389} \approx 0.119.
$$

**Threshold decision:** since $0.119 < 0.5$, the model predicts $\hat{y} = 0$ (fail). Notice this matches checking the sign of $z$ directly: $z = -2 < 0$, so the prediction is $0$ without even computing the sigmoid — the sigmoid value only *additionally* tells us the model is fairly confident ($88.1\%$ against passing), not just which side of the threshold we're on.
:::

## Explore it yourself

Below is exactly the pass/fail model above, plotted as $\sigma(wx + b)$ for a range of study hours $x$. Drag **w** and **b** and watch the S-shaped curve move. The point where the curve crosses $0.5$ (halfway up) is the **decision boundary** — everything to one side is predicted class $1$, everything to the other side class $0$. Try setting $w = 1$, $b = -3$ to reproduce the worked example above, and check that the curve crosses $0.5$ at $x = 3$.

::py{src="items/classification-explorer.py" height=420}

A steeper curve (large $|w|$) means the model switches confidently from "definitely fail" to "definitely pass" over a narrow range of hours; a shallow curve means it stays uncertain over a wide range. The next lesson makes the idea of a decision boundary precise, and shows how to check whether a classifier's predictions are actually any good.
