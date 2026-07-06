# Gradient descent: following the loss downhill

In the last lesson we saw that a good line has a small MSE, and a perfect line has $\text{MSE} = 0$. But we had to be *told* the best-fitting line $w = 3$, $b = -1$. In practice nobody hands us the answer — we need an algorithm that starts from a guess and improves it automatically. That algorithm is **gradient descent**.

## The loss as a landscape

Think of the MSE as a function of the two numbers we're trying to choose, $w$ and $b$: $\text{MSE}(w, b)$. For linear regression this function is shaped like a smooth bowl (a paraboloid) sitting above the $(w, b)$ plane, with a single lowest point at the best-fitting $w$ and $b$. Training means starting somewhere on that bowl and walking downhill until we reach the bottom.

The **gradient** of the loss, $\left(\frac{\partial \text{MSE}}{\partial w}, \frac{\partial \text{MSE}}{\partial b}\right)$, points in the direction of *steepest increase* of the loss at the current $(w, b)$. To go downhill, we simply step in the **opposite** direction.

## The gradients for MSE

Differentiating $\text{MSE} = \frac{1}{n}\sum_i (wx_i + b - y_i)^2$ with respect to $w$ and $b$ (by the chain rule) gives:

$$
\frac{\partial \text{MSE}}{\partial w} = \frac{2}{n}\sum_{i=1}^{n} \big(w x_i + b - y_i\big)\, x_i,
\qquad
\frac{\partial \text{MSE}}{\partial b} = \frac{2}{n}\sum_{i=1}^{n} \big(w x_i + b - y_i\big).
$$

Notice both gradients are built from the same residuals $e_i = w x_i + b - y_i$ we met in the last lesson: the $w$-gradient weights each residual by its $x_i$, while the $b$-gradient just averages the residuals directly.

## The update rule

Gradient descent repeatedly nudges $w$ and $b$ a small step **against** the gradient:

$$
w \leftarrow w - \eta \, \frac{\partial \text{MSE}}{\partial w},
\qquad
b \leftarrow b - \eta \, \frac{\partial \text{MSE}}{\partial b}.
$$

Here $\eta$ (eta) is the **learning rate**: a small positive number that sets the *size* of each step. One full pass of this update, using every data point, is called an **epoch**. Training for more epochs means taking more steps, gradually walking further downhill.

:::callout{kind="key"}
Gradient descent for linear regression is: compute the gradients of the MSE with respect to $w$ and $b$ over the data, then move $w$ and $b$ a small step ($\eta$, the learning rate) in the opposite direction. Repeat for many epochs.
:::

## Choosing a learning rate

The learning rate controls a trade-off:

- **Too small**, and each step moves almost nowhere — training needs a huge number of epochs to get close to the minimum.
- **Too large**, and each step overshoots the bottom of the bowl, possibly landing on a point with an even *higher* loss than before. Repeated overshooting can make $w$ and $b$ swing wildly and diverge (the loss grows without bound) instead of settling down.
- A **well-chosen** learning rate steadily and efficiently walks downhill to (or very near) the minimum.

## One gradient step, worked by hand

Suppose, before seeing any data, we guess the flat line $w = 0$, $b = 1$ (predicting a constant $\hat{y} = 1$ regardless of $x$) for the sunshine/sales data $(1, 2), (2, 5), (3, 8)$ from the last lesson.

:::reveal{title="Worked example: one gradient-descent step from w = 0, b = 1"}
**Predictions and residuals** with $w = 0$, $b = 1$ (so $\hat{y} = 1$ for every $x$):

| $x$ | $y$ | $\hat{y} = 0x + 1$ | $e = \hat{y} - y$ |
| --- | --- | --- | --- |
| 1 | 2 | 1 | $-1$ |
| 2 | 5 | 1 | $-4$ |
| 3 | 8 | 1 | $-7$ |

**Loss:** $\text{MSE} = \dfrac{(-1)^2 + (-4)^2 + (-7)^2}{3} = \dfrac{1 + 16 + 49}{3} = \dfrac{66}{3} = 22$.

**Gradients** ($n = 3$):

$$
\frac{\partial \text{MSE}}{\partial w} = \frac{2}{3}\big[(-1)(1) + (-4)(2) + (-7)(3)\big] = \frac{2}{3}(-1 - 8 - 21) = \frac{2}{3}(-30) = -20.
$$

$$
\frac{\partial \text{MSE}}{\partial b} = \frac{2}{3}\big[(-1) + (-4) + (-7)\big] = \frac{2}{3}(-12) = -8.
$$

**Update** with learning rate $\eta = 0.1$:

$$
w \leftarrow 0 - (0.1)(-20) = 2.0, \qquad b \leftarrow 1 - (0.1)(-8) = 1.8.
$$

A single step has moved the flat guess $w=0,\,b=1$ to $w = 2.0,\, b = 1.8$ — already much closer to the true $w=3,\,b=-1$... except $b$ moved the *wrong* way (from $1$ up to $1.8$, away from $-1$). This is normal: one step rarely lands exactly right, and $w$ and $b$ are updated *simultaneously* using gradients computed at the *same* starting point, so their paths can briefly move in directions that only make sense together. More epochs correct this — see for yourself below.
:::

## Explore it yourself

Below is a live gradient-descent trainer on the same three sunshine/sales points, built by calling `courselib.ai.train_linreg_1d` — the same helper function used throughout this module — with the learning rate and epoch count you choose. Drag **Learning rate** and **Epochs** and watch the fitted line move. Try a very small learning rate (slow crawl), a moderate one (steady convergence towards the line from Lesson 1), and then push the learning rate close to its maximum to see the fit overshoot and diverge.

::py{src="items/gradient-descent-explorer.py" height=420}

With enough epochs at a sensible learning rate, the line settles very close to the best fit $w = 3$, $b = -1$ found in the last lesson. The next lesson traces the arithmetic of these first few steps completely by hand, starting from $w = 0$, $b = 0$.
