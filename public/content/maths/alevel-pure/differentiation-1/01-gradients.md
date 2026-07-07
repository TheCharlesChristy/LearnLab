# Gradients of curves

For a straight line, the gradient is the same everywhere: it is the constant rate at which $y$ changes as $x$ changes. For a curve, the steepness changes from point to point, so we need a more careful idea of "gradient at a point".

## The gradient of a straight line

If a straight line passes through $(x_1, y_1)$ and $(x_2, y_2)$, its gradient is

$$
m = \frac{y_2 - y_1}{x_2 - x_1} = \frac{\Delta y}{\Delta x}.
$$

This measures how much $y$ rises for each unit increase in $x$.

## What does "gradient" mean for a curve?

On a curve such as $y = x^2$, the steepness depends on where you are. Near the bottom the curve is almost flat; further out to the sides it rises steeply. We define the **gradient at a point** to be the gradient of the *tangent* — the straight line that just touches the curve at that point.

Drag the point along the curve below and read off the gradient of the tangent at each position.

::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}

:::callout{kind="key"}
The gradient of a curve at a point is defined as the gradient of the tangent to the curve at that point. The derivative is the function that gives this gradient for every value of $x$.
:::

## Approximating with a chord

We cannot read a tangent's gradient exactly just by looking, so we approximate it using a **chord**: a straight line joining two nearby points on the curve. If the second point is close to the first, the chord's gradient is close to the tangent's gradient.

Take the point $P = (2, 4)$ on $y = x^2$ and a nearby point $Q = (2 + h, (2+h)^2)$. The gradient of the chord $PQ$ is

$$
m_{PQ} = \frac{(2+h)^2 - 4}{(2+h) - 2} = \frac{4 + 4h + h^2 - 4}{h} = \frac{4h + h^2}{h} = 4 + h.
$$

As $h$ gets smaller, $4 + h$ gets closer to $4$. This strongly suggests the gradient of the tangent at $P$ is exactly $4$.

:::reveal{title="Worked example: chord gradient at x = 1"}
Take $P = (1, 1)$ on $y = x^2$ and $Q = (1 + h, (1+h)^2)$.

$$
m_{PQ} = \frac{(1+h)^2 - 1}{h} = \frac{1 + 2h + h^2 - 1}{h} = \frac{2h + h^2}{h} = 2 + h.
$$

For $h = 0.1$ this gives $2.1$; for $h = 0.01$ it gives $2.01$. As $h \to 0$ the chord gradient approaches $2$, so the gradient of $y = x^2$ at $x = 1$ is $2$. Notice this matches the pattern: at $x = 2$ the gradient was $4$, and at $x = 1$ it is $2$ — in each case it is $2x$.
:::

In the next lesson we make this limiting process precise: this is **differentiation from first principles**.
