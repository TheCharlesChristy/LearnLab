# The perceptron learning rule

*Neural Networks I* ended with a rule for updating a perceptron's weights from a single misclassified example:

$$
w_i \leftarrow w_i + \eta\,(t - y)\,x_i, \qquad b \leftarrow b + \eta\,(t - y),
$$

where $t$ is the target label, $y$ is the perceptron's current prediction, and $\eta$ (eta) is the learning rate. This lesson turns that one-example rule into a full **training algorithm**: applying it repeatedly, in order, over a whole data set.

## From one update to an algorithm

Training a perceptron means repeating the same simple loop:

1. Take the next training example $(\mathbf{x}, t)$.
2. Compute the prediction $y = \text{step}\!\left(\sum_i w_i x_i + b\right)$.
3. Update every weight and the bias using $\Delta w_i = \eta (t-y) x_i$ and $\Delta b = \eta (t-y)$ (which is $0$ whenever $y = t$, so correct examples leave the weights untouched).
4. Move to the next example; once every example has been seen, start again from the first.

:::callout{kind="key"}
One full pass through **every** training example, in order, is called an **epoch**. Training runs for repeated epochs until either (a) a whole epoch passes with **no** weight changes at all — every example is classified correctly, so training has **converged** — or (b) a fixed **maximum epoch count** is reached, so training simply stops even if some examples are still wrong.
:::

This is the same overall shape as the gradient descent you met in *Regression*: both are iterative algorithms that nudge parameters a little at a time, controlled by a learning rate, and both keep going for multiple passes over the data. The difference is *what* triggers an update. Gradient descent nudges $w$ and $b$ on **every** example, by an amount proportional to a smooth error gradient. The perceptron rule only nudges weights on **misclassified** examples, and the amount is fixed by $\eta(t-y)x_i$ rather than a calculus gradient — because the step activation has no useful gradient to follow (recall from *Neural Networks I* that this is exactly why the smooth sigmoid was introduced as an alternative).

## A training set to trace by hand

Throughout this module we will train a single perceptron with two inputs on this small, fixed data set:

| $x_1$ | $x_2$ | target $t$ |
| --- | --- | --- |
| $0$ | $0$ | $0$ |
| $1$ | $0$ | $0$ |
| $2$ | $2$ | $1$ |
| $3$ | $3$ | $1$ |

::widget{type="data-plot" src="training-data.json"}

Two points should end up classified $0$ and two should end up classified $1$. A single straight line, for example $x_1 + x_2 = 1.5$, clearly separates them — this data set is **linearly separable** (the topic of the next lesson). We will train with learning rate $\eta = 1$, starting from $w_1 = w_2 = b = 0$, and process the four examples in the order shown, top to bottom, for each epoch.

## Worked epoch, step by step

:::reveal{title="Worked example: the first epoch, example by example"}
Start at $w_1 = 0$, $w_2 = 0$, $b = 0$, with $\eta = 1$.

**Example 1: $(x_1, x_2) = (0, 0)$, $t = 0$.**
$$
z = (0)(0) + (0)(0) + 0 = 0.
$$
Since $z \ge 0$, the step activation fires: $y = 1$. But $t = 0$, so the error is $t - y = 0 - 1 = -1$. Update:
$$
\Delta w_1 = (1)(-1)(0) = 0, \quad \Delta w_2 = (1)(-1)(0) = 0, \quad \Delta b = (1)(-1) = -1.
$$
New weights: $w_1 = 0$, $w_2 = 0$, $b = -1$.

**Example 2: $(x_1, x_2) = (1, 0)$, $t = 0$.**
$$
z = (0)(1) + (0)(0) + (-1) = -1.
$$
Since $z < 0$, $y = 0$. This matches $t = 0$, so the error is $0$ and **nothing changes**: $w_1 = 0$, $w_2 = 0$, $b = -1$.

**Example 3: $(x_1, x_2) = (2, 2)$, $t = 1$.**
$$
z = (0)(2) + (0)(2) + (-1) = -1.
$$
Since $z < 0$, $y = 0$. But $t = 1$, so the error is $t - y = 1 - 0 = 1$. Update:
$$
\Delta w_1 = (1)(1)(2) = 2, \quad \Delta w_2 = (1)(1)(2) = 2, \quad \Delta b = (1)(1) = 1.
$$
New weights: $w_1 = 2$, $w_2 = 2$, $b = -1 + 1 = 0$.

**Example 4: $(x_1, x_2) = (3, 3)$, $t = 1$.**
$$
z = (2)(3) + (2)(3) + 0 = 12.
$$
Since $z \ge 0$, $y = 1$, matching $t = 1$. No change.

**End of epoch 1:** $w_1 = 2$, $w_2 = 2$, $b = 0$.
:::

Notice that epoch 1 involved two real updates and two "no-op" updates (where the perceptron was already correct). Is training finished? Check: at $w_1 = 2, w_2 = 2, b = 0$, example 1 gives $z = (2)(0)+(2)(0)+0 = 0 \ge 0$, so $y = 1$ — but $t = 0$. **Example 1 is now wrong again!** One epoch was not enough. The next lesson continues this exact trace into epoch 2 and asks the bigger question: how do we know repeating epochs will ever finish?

:::callout{kind="tip"}
Whenever an update fixes one example, it can un-fix a previously correct one — weights are shared across all examples. This is completely normal. What matters is whether the *whole process*, run for enough epochs, eventually settles with zero errors.
:::
