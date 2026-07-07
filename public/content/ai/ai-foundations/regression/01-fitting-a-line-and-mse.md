# Fitting a line: the model and the MSE loss

Much of machine learning boils down to one idea: choose a simple mathematical model, then tune its numbers so it matches some data as closely as possible. The simplest useful model is a **straight line**, and fitting one to data is called **linear regression**.

## The model: y = wx + b

Suppose a market-stall owner records the number of hours of sunshine each day, $x$, and their ice-cream van's sales that day, $y$, measured in tens of pounds:

| Hours of sunshine ($x$) | Sales, £10s ($y$) |
| --- | --- |
| 1 | 2 |
| 2 | 5 |
| 3 | 8 |

We want a line

$$
\hat{y} = wx + b
$$

that predicts sales $\hat{y}$ from sunshine hours $x$. Here $w$ is the **weight** (the slope — how much predicted sales change per extra hour of sunshine) and $b$ is the **bias** (the intercept — the predicted sales when $x = 0$). This is exactly the same $y = mx + c$ you already know from coordinate geometry, just with the names $w$ and $b$ that machine learning uses.

:::callout{kind="key"}
Linear regression means choosing $w$ and $b$ so that the line $\hat{y} = wx + b$ fits a set of $(x, y)$ data points as closely as possible.
:::

## Residuals: how wrong is a prediction?

For each data point $(x_i, y_i)$, the line predicts $\hat{y}_i = w x_i + b$. The **residual** (or error) is the difference between the prediction and the actual value:

$$
e_i = \hat{y}_i - y_i = (w x_i + b) - y_i.
$$

A residual of $0$ means a perfect prediction for that point; a large positive or negative residual means the line is far from the data there.

## The mean squared error (MSE) loss

To judge *how good the whole line is*, we need a single number that summarises all the residuals. We can't just add them up — positive and negative residuals would cancel out, so a line that is wildly wrong in both directions could look "perfect" on average. Instead we square each residual (so every contribution is positive, and larger errors count for much more) and take the mean over all $n$ data points:

$$
\text{MSE} = \frac{1}{n} \sum_{i=1}^{n} e_i^2 = \frac{1}{n} \sum_{i=1}^{n} \big(w x_i + b - y_i\big)^2.
$$

This is the **mean squared error**, the standard **loss function** for linear regression. A smaller MSE means a better-fitting line; $\text{MSE} = 0$ means every point lies exactly on the line. Training a linear regression model means **choosing $w$ and $b$ to make the MSE as small as possible** — this is exactly what gradient descent, the subject of the next lesson, does automatically.

:::callout{kind="tip"}
Squaring serves two purposes: it makes every error contribute positively (no cancellation), and it penalises large errors much more than small ones — a residual of $4$ contributes $16$ to the sum, sixteen times as much as a residual of $1$.
:::

## Comparing two candidate lines

The plot below shows the three sales data points together with two candidate lines: a rough guess $\hat{y} = 2x$ (so $w = 2$, $b = 0$) and the best-fitting line $\hat{y} = 3x - 1$ (so $w = 3$, $b = -1$).

::widget{type="data-plot" src="sales-data.json"}

:::reveal{title="Worked example: comparing two candidate lines by MSE"}
**Candidate 1: $w = 2$, $b = 0$.** Predictions are $\hat{y} = 2x$:

| $x$ | $y$ | $\hat{y} = 2x$ | $e = \hat{y} - y$ | $e^2$ |
| --- | --- | --- | --- | --- |
| 1 | 2 | 2 | 0 | 0 |
| 2 | 5 | 4 | $-1$ | 1 |
| 3 | 8 | 6 | $-2$ | 4 |

$$
\text{MSE} = \frac{0 + 1 + 4}{3} = \frac{5}{3} \approx 1.667.
$$

**Candidate 2: $w = 3$, $b = -1$.** Predictions are $\hat{y} = 3x - 1$:

| $x$ | $y$ | $\hat{y} = 3x - 1$ | $e = \hat{y} - y$ | $e^2$ |
| --- | --- | --- | --- | --- |
| 1 | 2 | 2 | 0 | 0 |
| 2 | 5 | 5 | 0 | 0 |
| 3 | 8 | 8 | 0 | 0 |

$$
\text{MSE} = \frac{0 + 0 + 0}{3} = 0.
$$

Candidate 2 fits every point exactly (this tiny data set happens to lie exactly on a line), so its MSE of $0$ is unbeatable. Candidate 1's MSE of $1.667$ correctly tells us it is a worse fit, even though it isn't a *terrible* guess.
:::

## Interpreting slope and intercept

For the best-fitting line $\hat{y} = 3x - 1$:

- The **slope** $w = 3$ means each extra hour of sunshine is associated with $3$ more (tens of £), i.e. **£30** more in sales.
- The **intercept** $b = -1$ means the line predicts $-1$ (tens of £), i.e. $-£10$, when $x = 0$. Since the data only covers $x = 1$ to $x = 3$, this is an **extrapolation** far outside the observed range, and a negative sales figure is not realistic — a reminder that the intercept is a property of the fitted line, not necessarily a meaningful real-world prediction.

The next lesson asks the key question: given only the data (not the answer $w=3, b=-1$), how does a computer *find* the line that minimises the MSE?
