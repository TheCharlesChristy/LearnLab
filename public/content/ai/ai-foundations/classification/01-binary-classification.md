# Binary classification: a category, not a number

So far, predicting a quantity such as house price or exam score from features has meant **regression**: the target is a continuous number, and a good model gets close to it. Many important problems instead ask a different kind of question: *which of two categories does this example belong to?*

- Is this email **spam** or **not spam**?
- Will this student **pass** or **fail**?
- Is this tumour **malignant** or **benign**?
- Will this loan applicant **default** or **repay**?

Each of these has exactly two possible outcomes. Problems like this are called **binary classification**: instead of predicting a number that can take any value, we predict one of two labels, conventionally written $0$ and $1$.

:::callout{kind="key"}
**Regression** predicts a continuous number (e.g. "this house is worth £312,400"). **Classification** predicts a category from a fixed set (e.g. "this email is spam"). Binary classification is the special case with exactly two categories, labelled $0$ and $1$.
:::

## Why not just reuse linear regression?

It is tempting to reuse the linear regression machinery directly: fit a line $y = wx + b$ to data where $y$ is $0$ for one class and $1$ for the other, then read off a prediction. This runs into two serious problems.

**1. The output is not a probability.** A fitted line $y = wx + b$ can take *any* real value, including numbers far outside $[0, 1]$. A prediction of $y = 1.4$ or $y = -0.3$ cannot sensibly be read as "the probability this student passes", because probabilities must lie between $0$ and $1$.

**2. Outliers distort the boundary.** Because ordinary regression minimises squared error over an unbounded output, a single extreme example (say, a student who studied for 40 hours) can drag the whole fitted line — and with it, the implied decision boundary — even though it should barely matter to the classification decision for everyone else.

:::reveal{title="Worked example: linear regression predicting a nonsensical probability"}
Suppose we (incorrectly) fit an ordinary linear regression $y = 0.3x - 0.4$ to predict a pass ($1$) / fail ($0$) label directly from hours studied $x$.

For a student who studied $x = 6$ hours:

$$
y = (0.3)(6) - 0.4 = 1.8 - 0.4 = 1.4.
$$

A "probability" of $1.4$ is meaningless — probabilities cannot exceed $1$. For a student who studied $x = 1$ hour:

$$
y = (0.3)(1) - 0.4 = 0.3 - 0.4 = -0.1,
$$

a negative "probability", equally meaningless. Linear regression's raw output is simply the wrong shape for a probability. We need a model whose output is always squashed into $(0, 1)$ — that is exactly what the next lesson introduces.
:::

## What we need instead

A binary classifier should output a number between $0$ and $1$ that we can interpret as *confidence that the example belongs to class $1$*. Then a simple rule converts that confidence into an actual prediction. The most widely used approach for this is **logistic regression**, the subject of the next lesson — despite the name, it is a classification method, not a regression method.
