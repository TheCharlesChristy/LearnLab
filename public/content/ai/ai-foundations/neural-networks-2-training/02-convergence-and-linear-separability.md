# Training to convergence: linear separability revisited

The previous lesson left us mid-training: one epoch of updates on our four-point data set produced $w_1 = 2$, $w_2 = 2$, $b = 0$ — but example 1, $(0,0) \to 0$, had become misclassified again. Does repeating epochs ever settle down, or could a perceptron chase its tail forever?

## The perceptron convergence theorem

The answer is one of the classic results about perceptrons, due to Rosenblatt and later proved rigorously by Novikoff (1962):

:::callout{kind="key"}
**Perceptron convergence theorem.** If a training set is **linearly separable**, the perceptron learning rule is guaranteed to find a set of weights that classifies every example correctly, after a finite number of epochs — regardless of the initial weights or the order examples are presented in (for a fixed learning rate $\eta > 0$). If the data is **not** linearly separable, no such weights exist, and the rule will never converge, however many epochs are run.
:::

This is a genuinely strong guarantee: it doesn't just say training *usually* works, it says training is **certain** to work in finitely many steps, provided the one geometric condition — linear separability — holds. Recall from *Neural Networks I*: a data set is linearly separable if some single straight line (in general, a hyperplane) puts every target-$1$ example on one side and every target-$0$ example on the other.

## Finishing the trace: epoch 2

:::reveal{title="Worked example: epoch 2, reaching convergence"}
Continuing from the end of epoch 1 ($w_1 = 2$, $w_2 = 2$, $b = 0$, $\eta = 1$):

**Example 1: $(0, 0)$, $t = 0$.**
$$
z = (2)(0) + (2)(0) + 0 = 0 \ \Rightarrow\ y = 1 \ (\text{since } z \ge 0).
$$
Error $= 0 - 1 = -1$. Update: $\Delta w_1 = (1)(-1)(0) = 0$, $\Delta w_2 = 0$, $\Delta b = (1)(-1) = -1$.
New weights: $w_1 = 2$, $w_2 = 2$, $b = -1$.

**Example 2: $(1, 0)$, $t = 0$.**
$$
z = (2)(1) + (2)(0) + (-1) = 1 \ \Rightarrow\ y = 1.
$$
Error $= 0 - 1 = -1$. Update: $\Delta w_1 = (1)(-1)(1) = -1$, $\Delta w_2 = (1)(-1)(0) = 0$, $\Delta b = -1$.
New weights: $w_1 = 2 - 1 = 1$, $w_2 = 2$, $b = -1 - 1 = -2$.

**Example 3: $(2, 2)$, $t = 1$.**
$$
z = (1)(2) + (2)(2) + (-2) = 2 + 4 - 2 = 4 \ \Rightarrow\ y = 1.
$$
Matches $t = 1$ — no change.

**Example 4: $(3, 3)$, $t = 1$.**
$$
z = (1)(3) + (2)(3) + (-2) = 3 + 6 - 2 = 7 \ \Rightarrow\ y = 1.
$$
Matches $t = 1$ — no change.

**End of epoch 2:** $w_1 = 1$, $w_2 = 2$, $b = -2$. Checking **all four** examples against these final weights:

| $(x_1,x_2)$ | $z = (1)x_1 + (2)x_2 + (-2)$ | $y$ | $t$ | correct? |
| --- | --- | --- | --- | --- |
| $(0,0)$ | $-2$ | $0$ | $0$ | ✓ |
| $(1,0)$ | $-1$ | $0$ | $0$ | ✓ |
| $(2,2)$ | $4$ | $1$ | $1$ | ✓ |
| $(3,3)$ | $7$ | $1$ | $1$ | ✓ |

Every example is now correct — an entire epoch (epoch 3) would produce **zero** updates. Training has **converged after 2 epochs**, exactly as the convergence theorem promised, since this data set is linearly separable.
:::

## Watch it train

The simulation below runs exactly this training loop on exactly this data set, live. Press **Play** to advance one training example at a time; the decision boundary line $w_1 x_1 + w_2 x_2 + b = 0$ redraws after every update, points turn green when the current boundary classifies them correctly and red when it doesn't, and the current epoch, weights and bias are shown underneath. Use **Pause** to stop and **Reset** to return to $w_1 = w_2 = b = 0$ and replay it.

::py{src="items/perceptron-trainer.py" height=520}

Watch example $(0,0)$ flicker between correctly and incorrectly classified across epoch 1 — the same "un-fixing" behaviour from the previous lesson — before the boundary settles for good once every point is on the right side.

## Why XOR never converges

*Neural Networks I* showed that XOR — target $1$ at $(0,1)$ and $(1,0)$, target $0$ at $(0,0)$ and $(1,1)$ — is **not** linearly separable: its two target-$1$ points sit on one diagonal and its two target-$0$ points sit on the other, and no single line separates a pair of diagonals. By the convergence theorem, this one geometric fact is enough to predict that training a single perceptron on XOR **can never converge**, no matter the learning rate or how many epochs are allowed.

:::reveal{title="Proof: no weights classify XOR correctly"}
Suppose weights $w_1, w_2, b$ classified XOR perfectly using the step rule (fires when $z \ge 0$). Then all four conditions below would have to hold simultaneously:

$$
(0,0)\to 0:\quad b < 0 \qquad\qquad (1,1)\to 0:\quad w_1 + w_2 + b < 0
$$
$$
(0,1)\to 1:\quad w_2 + b \ge 0 \qquad (1,0)\to 1:\quad w_1 + b \ge 0
$$

Adding the two "$\to 1$" inequalities: $w_1 + w_2 + 2b \ge 0$, i.e. $w_1 + w_2 \ge -2b$.

But the "$(1,1)\to 0$" inequality says $w_1 + w_2 < -b$.

So we would need $-2b \le w_1 + w_2 < -b$. Since $b < 0$ (from the first condition), both $-2b$ and $-b$ are positive, and $-2b > -b$ (because $-2b - (-b) = -b > 0$). That means the required range $[-2b,\, -b)$ has its lower end **above** its upper end — an empty, impossible range. No values of $w_1, w_2, b$ can satisfy all four conditions at once. $\blacksquare$
:::

Because no correct weights exist at all, the training loop can never reach the "whole epoch with zero updates" stopping condition — it will cycle indefinitely, endlessly correcting one example while breaking another, exactly the "un-fixing" pattern from lesson 1 but with no resting point to settle into.

:::callout{kind="warning"}
This is why every real training loop needs a **maximum epoch count**, not just a convergence check: on non-linearly-separable data, "wait for zero errors" would simply never terminate. The convergence theorem tells us *in advance*, from the geometry of the data alone, whether that maximum will ever actually be needed.
:::

If a single perceptron is fundamentally limited to one straight line, how did the field move past this limitation? The final lesson answers that.
