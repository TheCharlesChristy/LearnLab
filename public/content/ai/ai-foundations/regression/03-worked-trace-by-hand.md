# A worked gradient-descent trace by hand

This lesson performs a complete, exact hand trace of gradient descent on the sunshine/sales data from Lesson 1: $(1, 2)$, $(2, 5)$, $(3, 8)$ (three days of hours of sunshine $x$ and van sales in tens of £, $y$). We start from the standard initialisation $w = 0$, $b = 0$ — pretending, as a real training run would, that we don't yet know the best fit is $w = 3$, $b = -1$ — and take two full gradient-descent steps with learning rate $\eta = 0.01$.

## Setup

- Data: $(x_1, y_1) = (1, 2)$, $(x_2, y_2) = (2, 5)$, $(x_3, y_3) = (3, 8)$, so $n = 3$.
- Initial parameters: $w_0 = 0$, $b_0 = 0$.
- Learning rate: $\eta = 0.01$.
- Update rule (from Lesson 2): $w \leftarrow w - \eta\,\frac{\partial \text{MSE}}{\partial w}$, $b \leftarrow b - \eta\,\frac{\partial \text{MSE}}{\partial b}$, with $\frac{\partial \text{MSE}}{\partial w} = \frac{2}{n}\sum_i (wx_i+b-y_i)x_i$ and $\frac{\partial \text{MSE}}{\partial b} = \frac{2}{n}\sum_i (wx_i+b-y_i)$.

:::reveal{title="Full worked trace: two gradient-descent steps from w = 0, b = 0"}

### Step 1

**Predictions and residuals** with $w_0 = 0$, $b_0 = 0$ (so $\hat{y} = 0$ everywhere):

| $x$ | $y$ | $\hat{y}=0x+0$ | $e=\hat{y}-y$ | $e^2$ | $e \cdot x$ |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | 0 | $-2$ | 4 | $-2$ |
| 2 | 5 | 0 | $-5$ | 25 | $-10$ |
| 3 | 8 | 0 | $-8$ | 64 | $-24$ |

**Loss before the step:**

$$
\text{MSE} = \frac{4+25+64}{3} = \frac{93}{3} = 31.0.
$$

**Gradients:**

$$
\frac{\partial \text{MSE}}{\partial w} = \frac{2}{3}\big(-2-10-24\big) = \frac{2}{3}(-36) = -24.0,
\qquad
\frac{\partial \text{MSE}}{\partial b} = \frac{2}{3}\big(-2-5-8\big) = \frac{2}{3}(-15) = -10.0.
$$

**Update** ($\eta = 0.01$):

$$
w_1 = 0 - (0.01)(-24.0) = 0.24, \qquad b_1 = 0 - (0.01)(-10.0) = 0.10.
$$

### Step 2

**Predictions and residuals** with $w_1 = 0.24$, $b_1 = 0.10$:

| $x$ | $y$ | $\hat{y}=0.24x+0.10$ | $e=\hat{y}-y$ | $e^2$ | $e \cdot x$ |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | $0.34$ | $-1.66$ | $2.7556$ | $-1.66$ |
| 2 | 5 | $0.58$ | $-4.42$ | $19.5364$ | $-8.84$ |
| 3 | 8 | $0.82$ | $-7.18$ | $51.5524$ | $-21.54$ |

**Loss at the start of step 2** (i.e. after step 1's update):

$$
\text{MSE} = \frac{2.7556 + 19.5364 + 51.5524}{3} = \frac{73.8444}{3} = 24.6148.
$$

**Gradients:**

$$
\frac{\partial \text{MSE}}{\partial w} = \frac{2}{3}\big(-1.66-8.84-21.54\big) = \frac{2}{3}(-32.04) = -21.36,
\qquad
\frac{\partial \text{MSE}}{\partial b} = \frac{2}{3}\big(-1.66-4.42-7.18\big) = \frac{2}{3}(-13.26) = -8.84.
$$

**Update** ($\eta = 0.01$):

$$
w_2 = 0.24 - (0.01)(-21.36) = 0.24 + 0.2136 = 0.4536,
\qquad
b_2 = 0.10 - (0.01)(-8.84) = 0.10 + 0.0884 = 0.1884.
$$

**Loss after step 2** (evaluating the MSE at $w_2 = 0.4536$, $b_2 = 0.1884$): $\text{MSE} \approx 19.567108$.

### Summary of the trace

| After step | $w$ | $b$ | MSE |
| --- | --- | --- | --- |
| 0 (start) | $0$ | $0$ | $31.0$ |
| 1 | $0.24$ | $0.10$ | $24.6148$ |
| 2 | $0.4536$ | $0.1884$ | $19.567108$ |

Two things to notice: the loss falls after every step ($31.0 \to 24.6148 \to 19.567108$), and $w$ is climbing steadily towards the true value $3$ while $b$ is climbing towards $-1$ — but slowly, because $\eta = 0.01$ is a cautious learning rate. Running the interactive explorer from Lesson 2 with many more epochs at this same learning rate (or a slightly larger one) continues exactly this process until $w$ and $b$ settle close to $3$ and $-1$.
:::

## Checking the trace against the model

This is precisely what `courselib.ai.train_linreg_1d(points, lr, epochs)` computes internally — the same helper wired up in Lesson 2's interactive item. Calling it with `points=[(1,2),(2,5),(3,8)]`, `lr=0.01`, `epochs=2` returns exactly the history traced above: `{"epoch": 0, "w": 0.0, "b": 0.0, "loss": 31.0}`, then `{"epoch": 1, "w": 0.24, "b": 0.1, "loss": 24.6148}`, then the final `{"epoch": 2, "w": 0.4536, "b": 0.1884, "loss": 19.567108}`. Hand arithmetic and code agree exactly, because both are doing the same sums — the point of this lesson is to show there is no magic inside gradient descent, only the arithmetic you have just carried out twice.

## Interpreting the fitted line

Once training has converged (many more epochs than we traced by hand), the line settles at $w \approx 3$, $b \approx -1$ — the best fit from Lesson 1. In context:

- $w \approx 3$: each additional hour of sunshine predicts about $3$ more tens of £ (**£30**) in van sales.
- $b \approx -1$: the line's prediction at zero hours of sunshine is $-1$ tens of £, an extrapolation outside the observed data ($x=1$ to $x=3$) that should not be read as a literal forecast of negative sales.

You now have the complete picture: a model ($\hat{y}=wx+b$), a loss (MSE) that measures how wrong it is, and an algorithm (gradient descent) that adjusts the model to shrink that loss, one small step at a time. Try the end-of-module assessment to consolidate.
