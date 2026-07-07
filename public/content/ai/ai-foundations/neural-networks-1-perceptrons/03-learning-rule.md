# The perceptron learning rule

So far we have *chosen* weights by hand (e.g. $w_1 = w_2 = 1$, $b = -1.5$ for the AND gate). The real power of a perceptron is that it can **learn** its own weights from labelled examples. The procedure is the **perceptron learning rule**.

## The rule

We show the perceptron training examples one at a time. For each example with inputs $\mathbf{x}$ and correct label $t$ (the *target*, $0$ or $1$), the perceptron produces its current prediction $y = \text{step}\!\left(\sum_i w_i x_i + b\right)$. We then nudge every weight in proportion to the **error** $(t - y)$:

$$
w_i \leftarrow w_i + \eta\,(t - y)\,x_i,
\qquad
b \leftarrow b + \eta\,(t - y).
$$

Here $\eta$ (eta) is the **learning rate**, a small positive number controlling step size.

- If the prediction is correct, $t - y = 0$ and **nothing changes**.
- If the perceptron output $0$ but should have output $1$ ($t - y = +1$), the weights move *towards* that input.
- If it output $1$ but should have output $0$ ($t - y = -1$), the weights move *away*.

:::callout{kind="key"}
The perceptron learning rule only changes the weights when the perceptron is **wrong**. Each update is $\Delta w_i = \eta\,(t - y)\,x_i$, pushing the decision boundary in the direction that fixes the mistake.
:::

## One update, step by step

Suppose $\eta = 0.1$, current weights $w_1 = 0.2$, $w_2 = 0.2$, bias $b = 0$. We present the example $\mathbf{x} = (1, 1)$ whose correct label is $t = 1$.

1. Weighted sum: $z = (0.2)(1) + (0.2)(1) + 0 = 0.4$.
2. Prediction: $z = 0.4 \ge 0$, so $y = \text{step}(0.4) = 1$.
3. Error: $t - y = 1 - 1 = 0$.

The prediction is already correct, so no weights change. Now look at a case where it is wrong.

:::reveal{title="Worked example: correcting a misclassification"}
Let $\eta = 0.1$, $w_1 = 0$, $w_2 = 0$, $b = 0$, and present $\mathbf{x} = (1, 1)$ with target $t = 1$.

**Predict.** $z = (0)(1) + (0)(1) + 0 = 0$. Since $0 \ge 0$, $y = 1$ — already correct here, so to see a real update take the target to be on the firing side from a negative start instead: set $b = -0.5$ so $z = 0 + 0 - 0.5 = -0.5 < 0$, giving $y = 0$ while $t = 1$.

**Error.** $t - y = 1 - 0 = +1$.

**Update each weight** with $\Delta = \eta (t - y) x_i$:

$$
w_1 \leftarrow 0 + (0.1)(1)(1) = 0.1, \quad
w_2 \leftarrow 0 + (0.1)(1)(1) = 0.1,
$$

$$
b \leftarrow -0.5 + (0.1)(1) = -0.4.
$$

**Check the new prediction.** $z = (0.1)(1) + (0.1)(1) - 0.4 = 0.2 - 0.4 = -0.2$. Still negative, but it moved from $-0.5$ toward $0$ — closer to firing. Repeating the rule over the data set walks the boundary into place. This convergence is guaranteed *if the data is linearly separable*.
:::

## Linear separability and the limits of one perceptron

A single perceptron can only ever draw **one straight line** (a *linear* decision boundary). A data set is **linearly separable** if some straight line puts all the $1$s on one side and all the $0$s on the other.

- **AND** and **OR** are linearly separable — a single perceptron learns them.
- **XOR** is **not** linearly separable. Its $1$s sit at $(0,1)$ and $(1,0)$ while its $0$s sit at $(0,0)$ and $(1,1)$; no single straight line can separate those two diagonals.

This famous limitation (Minsky and Papert, 1969) is exactly why we **stack** perceptrons into multi-layer networks: two layers can carve the plane with several lines and solve XOR. That is the subject of the next module, *Neural Networks II — Training*.

:::callout{kind="warning"}
The perceptron convergence theorem guarantees a solution **only when the data is linearly separable**. On non-separable data such as XOR, the single-perceptron learning rule never settles — it keeps oscillating. The fix is more neurons, not more iterations.
:::

You now have the full picture of one neuron: a weighted sum, an activation, a decision boundary, and a rule to learn it. Try the end-of-module assessment to consolidate.
